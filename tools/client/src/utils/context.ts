// src/utils/context.ts
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { dirname, join, relative, resolve } from 'path';

export type ProjectContext = {
  type: 'monorepo-root' | 'monorepo-member' | 'single-project';
  workspaceRoot: string;
  projectPath: string;
};

export const resolveProjectContext = (startPath: string): ProjectContext => {
  const absolutePath = resolve(startPath);
  let current = absolutePath;
  let candidateMonorepoRoot: string | null = null;

  // Buscar hacia arriba hasta encontrar un package.json con "workspaces"
  while (current !== '/') {
    const pkgPath = join(current, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.workspaces) {
        if (current === absolutePath) {
          return {
            type: 'monorepo-root',
            workspaceRoot: current,
            projectPath: current,
          };
        } else {
          candidateMonorepoRoot = current;
          break;
        }
      }
    }
    current = dirname(current);
  }

  if (candidateMonorepoRoot) {
    const rel = relative(candidateMonorepoRoot, absolutePath);
    const workspaceFolders: string[] = [];
    const pkg = JSON.parse(
      readFileSync(join(candidateMonorepoRoot, 'package.json'), 'utf-8')
    );

    for (const pattern of pkg.workspaces || []) {
      const base = pattern.replace(/\*$|\/\*$/, '');
      const full = join(candidateMonorepoRoot, base);
      if (existsSync(full)) {
        for (const entry of readdirSync(full)) {
          const folder = join(full, entry);
          if (statSync(folder).isDirectory()) {
            workspaceFolders.push(folder);
          }
        }
      }
    }

    if (workspaceFolders.includes(absolutePath)) {
      return {
        type: 'monorepo-member',
        workspaceRoot: candidateMonorepoRoot,
        projectPath: absolutePath,
      };
    }
  }

  // Si no es parte de un monorepo
  return {
    type: 'single-project',
    workspaceRoot: absolutePath,
    projectPath: absolutePath,
  };
};
