// scripts/build/index.ts
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
import * as colors from '../../utils/colors';
import { extractImports } from '../../utils/parseImports';
import show from '../../utils/show';

const findWorkspaceRoot = (startPath: string): string => {
  let current = resolve(startPath);
  while (current !== '/') {
    const pkgPath = join(current, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.workspaces) return current;
    }
    current = dirname(current);
  }
  return process.cwd();
};

const getWorkspaces = (workspaceRoot: string): string[] => {
  const pkgPath = join(workspaceRoot, 'package.json');
  if (!existsSync(pkgPath)) return [];
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const workspaces: string[] = pkg.workspaces || [];
  return workspaces
    .flatMap((pattern) => {
      const base = pattern.replace(/\*$|\/\*$/, '');
      const full = join(workspaceRoot, base);
      return existsSync(full)
        ? readdirSync(full).map((p) => join(full, p))
        : [];
    })
    .filter((p) => statSync(p).isDirectory());
};

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
      parser: { syntax: 'typescript', decorators: true },
    },
    module: { type: 'commonjs' },
    sourceMaps: false,
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

  const workspaceRoot = findWorkspaceRoot(path);

  if (path === workspaceRoot) {
    const workspaces = getWorkspaces(workspaceRoot);
    if (workspaces.length === 0) {
      console.error(colors.red('❌ No se encontraron workspaces definidos.'));
      process.exit(1);
    }
    for (const projectPath of workspaces) {
      console.log(
        colors.blue(
          `🔍 Procesando proyecto: ${relative(workspaceRoot, projectPath)}`
        )
      );
      await buildProject(projectPath, workspaceRoot);
    }
  } else {
    await buildProject(path, workspaceRoot);
  }
};
