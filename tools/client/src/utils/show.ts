import * as colors from '../utils/colors';

const { stdout } = process;
const isTTY = stdout.isTTY;

const useEmoji = isTTY && process.env.CLI_USE_EMOJI !== '0';
const statusIcons = {
  OK: isTTY ? colors.green(`${useEmoji ? '🛠️ ' : '✔'} OK `) : 'OK',
  WARN: isTTY ? colors.yellow(`${useEmoji ? '⚠️' : '⚠'} WARN`) : 'WARN',
  RETRY: isTTY ? colors.yellow(`${useEmoji ? '⚠️' : '↺'} RETRY`) : 'RETRY',
  BUILT: isTTY ? colors.green(`${useEmoji ? '🛠️ ' : '⚒'} BUILT `) : 'BUILT',
  CACHED: isTTY ? colors.cyan(`${useEmoji ? '💾' : '●'} CACHED`) : 'CACHED',
  SKIPPED: isTTY
    ? colors.yellow(`${useEmoji ? '⚠️' : '⚠'} SKIPPED`)
    : 'SKIPPED',
};

export default function show(
  status: 'BUILT' | 'CACHED' | 'SKIPPED',
  filePath: string,
  duration?: number,
  size?: number,
  hashBefore?: string,
  hashAfter?: string
) {
  const col2 = 10;
  const col3 = 10;
  const col4 = 30;
  const termWidth = 90; //stdout.columns > 100 ? stdout.columns - 10 : 100;
  const rest = termWidth - col2 - col3 - col4;
  const col1 = rest > 40 ? rest : 40;
  const padding = ' ';

  const shortPath =
    filePath.length > col1
      ? '...' + filePath.slice(-col1 + 3)
      : filePath.padEnd(col1);
  const durationStr =
    duration != null
      ? `${duration.toFixed(1)}ms`.padStart(col2)
      : ''.padStart(col2);
  const sizeStr =
    size != null
      ? `${(size / 1024).toFixed(1)}KB`.padStart(col3)
      : ''.padStart(col3);
  const hashStr =
    hashBefore && hashAfter
      ? `${colors.magenta(hashBefore)} ➡️ ${colors.cyan(hashAfter)}`
      : hashBefore
        ? `${colors.magenta(hashBefore)}`
        : '';
  const hashOutput = hashStr.padEnd(col4);

  console.log(
    `  ${colors.dim('📄')} ${colors.bold(shortPath)}${padding}${statusIcons[status]}${padding}${colors.blue(durationStr)}${padding}${colors.yellow(sizeStr)}${padding}${hashOutput}`
  );
}
