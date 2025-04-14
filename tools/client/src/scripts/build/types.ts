import { existsSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import * as ts from 'typescript';
import * as colors from '../../utils/colors';

export async function buildTypes(
  projectPath: string,
  workspaceRoot: string,
  previousHashes?: Record<string, string>
): Promise<void> {
  const configPath = [
    join(projectPath, 'tsconfig.json'),
    join(workspaceRoot, '.', 'tsconfig.base.json'),
  ].find((p) => existsSync(p));

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

  const crypto = require('crypto');
  const getHash = (data: string) =>
    crypto.createHash('sha256').update(data).digest('hex').slice(0, 8);

  const filesToEmit = parsed.fileNames.filter((file) => {
    const srcExists = existsSync(file);
    const dtsPath = join(
      projectPath,
      'dist',
      file.replace(/.*src\//, '').replace(/\.tsx?$/, '.d.ts')
    );
    const dtsExists = existsSync(dtsPath);

    const content = srcExists ? readFileSync(file, 'utf-8') : '';
    const currentHash = getHash(content);
    const previousHash = previousHashes?.[file];

    return !dtsExists || currentHash !== previousHash;
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
