// src/scripts/build/index.ts
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'fs';
import { dirname, join, relative, resolve } from 'path';
import * as colors from '../../utils/colors';
import { resolveProjectContext } from '../../utils/context';
import { buildCode } from './code';
import { buildTypes } from './types';

const calculateFinalHash = (pipelineData: any) => {
  const crypto = require('crypto');
  const getHash = (data: string) =>
    crypto.createHash('sha256').update(data).digest('hex').slice(0, 8);

  return getHash(
    Object.values(pipelineData.files || {})
      .map((f: any) => f.build?.target || '')
      .join('')
  );
};

const buildProject = async (
  projectPath: string,
  workspaceRoot: string,
  opts: { code?: boolean; types?: boolean }
) => {
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

  if (opts.code || (!opts.code && !opts.types)) {
    await buildCode(projectPath, workspaceRoot, pipelineData);
  }
  if (opts.types || (!opts.code && !opts.types)) {
    await buildTypes(projectPath, workspaceRoot, pipelineData);
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

export const build = async (
  inputPath?: string,
  options: { code?: boolean; types?: boolean } = {}
) => {
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
        await buildProject(projectPath, context.workspaceRoot, options);
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
      await buildProject(context.projectPath, context.workspaceRoot, options);
      break;
    }
  }
};
