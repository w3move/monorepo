// src/scripts/build/types.ts
import { existsSync as fsExistsSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import ts from 'typescript';
import * as colors from '../../utils/colors';

const getHash = (data: string) =>
  require('crypto').createHash('sha256').update(data).digest('hex').slice(0, 8);

export async function buildTypes(
  projectPath: string,
  workspaceRoot: string,
  pipelineData: any
): Promise<void> {
  const configPath = [
    join(projectPath, 'tsconfig.json'),
    join(workspaceRoot, '.', 'tsconfig.base.json'),
  ].find((p) => fsExistsSync(p));

  if (!configPath) return;

  const parsed = ts.getParsedCommandLineOfConfigFile(
    configPath,
    {
      emitDeclarationOnly: true,
      noEmit: false,
      declaration: true,
      outDir: join(projectPath, 'dist'),
    },
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (d) =>
        console.error(ts.flattenDiagnosticMessageText(d.messageText, '')),
    }
  );

  if (!parsed) return;

  pipelineData.types = pipelineData.types || {};

  const filesToEmit = parsed.fileNames.filter((file) => {
    const dtsPath = join(
      projectPath,
      'dist',
      file.replace(/.*src\//, '').replace(/\.tsx?$/, '.d.ts')
    );
    const dtsExists = fsExistsSync(dtsPath);
    const content = readFileSync(file, 'utf-8');
    const hash = getHash(content);
    const previous = pipelineData.types[file];

    if (previous?.source === hash && dtsExists) return false;

    pipelineData.types[file] = { source: hash };
    return true;
  });

  if (filesToEmit.length === 0) {
    console.log(colors.cyan('🧩 Tipos ya generados y sin cambios.'));
    return;
  }

  const program = ts.createProgram({
    rootNames: filesToEmit,
    options: parsed.options,
  });

  const emitResult = program.emit();

  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics);

  if (diagnostics.length > 0) {
    console.warn(
      colors.yellow(
        `⚠️  TSC generó advertencias al emitir tipos en ${relative(workspaceRoot, projectPath)}`
      )
    );
    for (const diagnostic of diagnostics) {
      if (diagnostic.file) {
        const { line, character } =
          diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start || 0);
        const message = ts.flattenDiagnosticMessageText(
          diagnostic.messageText,
          '\n'
        );
        console.warn(
          ` · ${diagnostic.file.fileName.replace(projectPath, '.').replace(workspaceRoot, '.')} (${line + 1},${character + 1}): ${message}`
        );
      } else {
        console.warn(
          ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
        );
      }
    }
  }
}

export default buildTypes;
