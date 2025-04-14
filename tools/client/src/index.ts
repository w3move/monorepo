// src/index.ts
import { Command } from 'commander';
import { build } from './scripts/build';

const program = new Command();
program.version('1.0.0').description('Mi aplicación CLI');

program
  .command('build [path]')
  .description('Compila archivos con SWC y/o genera tipos')
  .option('--code', 'Solo compilar código con SWC')
  .option('--types', 'Solo generar archivos de definición (.d.ts)')
  .option('--all', 'Ejecutar ambos pasos (default)')
  .action((path, options) => build(path, options));

program.parse(process.argv);
