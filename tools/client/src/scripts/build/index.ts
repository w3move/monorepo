import { transformFileSync } from '@swc/core';
import * as crypto from 'crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'fs';
import { dirname, join, relative, resolve } from 'path';
import { performance } from 'perf_hooks';
import ts from 'typescript';
import * as colors from '../../utils/colors';
import { resolveProjectContext } from '../../utils/context';
import { extractImports } from '../../utils/parseImports';
import show from '../../utils/show';

const getHash = (data: string) =>
  crypto.createHash('sha256').update(data).digest('hex').slice(0, 8);

const buildFile = async (
  filePath: string,
  projectRoot: string,
  pipelineData: any
) => {
  const start = performance.now();
  const content = readFileSync(filePath, 'utf-8');
  const hashBefore = getHash(content);

  const relativePath = filePath.replace(`${projectRoot}/`, '');
  const previous = pipelineData.files?.[relativePath]?.build;
  const outputPath = join(
    projectRoot,
    'dist',
    relativePath.replace(/^src\//, '').replace(/\.ts$/, '.js')
  );

  if (previous?.source === hashBefore && existsSync(outputPath)) {
    const generatedCode = readFileSync(outputPath, 'utf-8');
    const generatedHash = getHash(generatedCode);
    if (previous.target === generatedHash) {
      show('CACHED', relativePath, 0, previous.size, previous.source);
      return;
    }
  }

  const { code } = transformFileSync(filePath, {
    jsc: {
      target: 'es2022',
      parser: { syntax: 'typescript', decorators: true, dynamicImport: true },
      transform: {
        decoratorMetadata: true,
        react: {
          runtime: 'automatic',
          importSource: 'react',
        },
      },
    },
    module: {
      type: 'commonjs',
      strict: true,
      strictMode: true,
      lazy: false,
      noInterop: false,
      ignoreDynamic: false,
    },
    sourceMaps: false,
    minify: false,
    inlineSourcesContent: false,
    swcrc: false,
  });

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, code);

  const hashAfter = getHash(code);
  const size = Buffer.byteLength(code, 'utf8');
  const duration = performance.now() - start;
  const imports = await extractImports(filePath);

  show('BUILT', relativePath, duration, size, hashBefore, hashAfter);

  pipelineData.files = pipelineData.files || {};
  pipelineData.files[relativePath] = {
    ...pipelineData.files[relativePath],
    build: { source: hashBefore, target: hashAfter, size, duration },
    imports,
  };
};

const traverseDirectory = async (
  dir: string,
  projectRoot: string,
  pipelineData: any
) => {
  return Promise.all(
    readdirSync(dir).map(async (file) => {
      const fullPath = join(dir, file);
      if (statSync(fullPath).isDirectory()) {
        await traverseDirectory(fullPath, projectRoot, pipelineData);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        await buildFile(fullPath, projectRoot, pipelineData);
      }
    })
  );
};

const calculateFinalHash = (pipelineData: any) => {
  return getHash(
    Object.values(pipelineData.files || {})
      .map((f: any) => f.build?.target || '')
      .join('')
  );
};

const buildProject = async (projectPath: string, workspaceRoot: string) => {
  const stats = statSync(projectPath);
  const relativeProjectPath = relative(workspaceRoot, projectPath);
  const pipelinePath = join(
    workspaceRoot,
    '.build',
    relativeProjectPath,
    'pipeline.json'
  );

  let pipelineData: any = {};
  if (existsSync(pipelinePath)) {
    try {
      pipelineData = JSON.parse(readFileSync(pipelinePath, 'utf-8'));
    } catch {
      pipelineData = {};
    }
  }

  if (stats.isFile()) {
    await buildFile(projectPath, projectPath, pipelineData);
  } else if (stats.isDirectory()) {
    const srcPath = join(projectPath, 'src');
    if (existsSync(srcPath)) {
      await traverseDirectory(srcPath, projectPath, pipelineData);
    }
  }

  pipelineData.finalHash = calculateFinalHash(pipelineData);

  const configPath = [
    join(projectPath, 'tsconfig.json'),
    join(workspaceRoot, '.', 'tsconfig.base.json'),
  ].find((p) => existsSync(p));
  if (configPath) {
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

    if (parsed) {
      const program = ts.createProgram({
        rootNames: parsed.fileNames,
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
              diagnostic.file.getLineAndCharacterOfPosition(
                diagnostic.start || 0
              );
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
  }
  mkdirSync(dirname(pipelinePath), { recursive: true });
  writeFileSync(pipelinePath, JSON.stringify(pipelineData, null, 2));

  console.log(
    colors.green(
      `📦 Metadata guardada en ${relative(workspaceRoot, pipelinePath)} con hash final: ${pipelineData.finalHash}\n`
    )
  );
};

export const build = async (inputPath?: string) => {
  const path = inputPath ? resolve(inputPath) : process.cwd();
  if (!existsSync(path)) {
    console.error(
      colors.red(`❌ El archivo o directorio '${path}' no existe.`)
    );
    process.exit(1);
  }

  const context = resolveProjectContext(path);

  switch (context.type) {
    case 'monorepo-root': {
      const pkg = JSON.parse(
        readFileSync(join(context.workspaceRoot, 'package.json'), 'utf-8')
      );
      const workspaces: string[] = pkg.workspaces || [];
      const projects = workspaces
        .flatMap((pattern) => {
          const base = pattern.replace(/\*$|\/\*$/, '');
          const full = join(context.workspaceRoot, base);
          return existsSync(full)
            ? readdirSync(full).map((p) => join(full, p))
            : [];
        })
        .filter((p) => statSync(p).isDirectory());

      for (const projectPath of projects) {
        console.log(
          colors.blue(
            `🔍 Procesando proyecto: ${relative(context.workspaceRoot, projectPath)}`
          )
        );
        await buildProject(projectPath, context.workspaceRoot);
      }
      break;
    }
    case 'monorepo-member':
    case 'single-project': {
      console.log(
        colors.blue(
          `🔍 Procesando proyecto: ${relative(context.workspaceRoot, context.projectPath)}`
        )
      );
      await buildProject(context.projectPath, context.workspaceRoot);
      break;
    }
  }
};
