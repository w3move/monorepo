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
import { dirname, join } from 'path';
import { performance } from 'perf_hooks';
import { extractImports } from '../../utils/parseImports';
import show from '../../utils/show';

const getHash = (data: string) =>
  crypto.createHash('sha256').update(data).digest('hex').slice(0, 8);

export const buildCodeFile = async (
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
        react: { runtime: 'automatic', importSource: 'react' },
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

export const buildCode = async (
  projectPath: string,
  pipelineData: any
): Promise<void> => {
  const traverse = async (dir: string) => {
    for (const file of readdirSync(dir)) {
      const fullPath = join(dir, file);
      if (statSync(fullPath).isDirectory()) {
        await traverse(fullPath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        await buildCodeFile(fullPath, projectPath, pipelineData);
      }
    }
  };

  const stats = statSync(projectPath);
  if (stats.isFile()) {
    await buildCodeFile(projectPath, projectPath, pipelineData);
  } else {
    const srcPath = join(projectPath, 'src');
    if (existsSync(srcPath)) await traverse(srcPath);
  }
};
