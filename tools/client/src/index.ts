import { Command } from 'commander';
import { build } from './scripts/build';

const program = new Command();
program.version('1.0.0').description('Mi aplicación CLI');

program
  .command('build [path]')
  .description('Compila archivos con SWC')
  .action((path) => build(path));

program.parse(process.argv);
