// utils/colors.ts
const isTTY = process.stdout.isTTY;

const wrapperColor =
  (start: string, end: string | null = '0'): ((str: string) => string) =>
  (str: string) => {
    return isTTY
      ? `\x1b[${start}m${str}${end !== null ? `\x1b[${end}m` : ''}`
      : str;
  };

export const reset = wrapperColor('0', '0');
export const bold = wrapperColor('1', '0');
export const dim = wrapperColor('2', '0');
export const italic = wrapperColor('3', '0');
export const underline = wrapperColor('4', '0');
export const inverse = wrapperColor('7', '0');
export const hidden = wrapperColor('8', '0');
export const strikethrough = wrapperColor('9', '0');

export const black = wrapperColor('30', '39');
export const red = wrapperColor('31', '39');
export const green = wrapperColor('32', '39');
export const yellow = wrapperColor('33', '39');
export const blue = wrapperColor('34', '39');
export const magenta = wrapperColor('35', '39');
export const cyan = wrapperColor('36', '39');
export const white = wrapperColor('37', '39');
export const gray = wrapperColor('90', '39');
export const grey = gray;

export const bgBlack = wrapperColor('40', '49');
export const bgRed = wrapperColor('41', '49');
export const bgGreen = wrapperColor('42', '49');
export const bgYellow = wrapperColor('43', '49');
export const bgBlue = wrapperColor('44', '49');
export const bgMagenta = wrapperColor('45', '49');
export const bgCyan = wrapperColor('46', '49');
export const bgWhite = wrapperColor('47', '49');

export const blackBright = wrapperColor('90', '39');
export const redBright = wrapperColor('91', '39');
export const greenBright = wrapperColor('92', '39');
export const yellowBright = wrapperColor('93', '39');
export const blueBright = wrapperColor('94', '39');
export const magentaBright = wrapperColor('95', '39');
export const cyanBright = wrapperColor('96', '39');
export const whiteBright = wrapperColor('97', '39');

export const bgBlackBright = wrapperColor('100', '49');
export const bgRedBright = wrapperColor('101', '49');
export const bgGreenBright = wrapperColor('102', '49');
export const bgYellowBright = wrapperColor('103', '49');
export const bgBlueBright = wrapperColor('104', '49');
export const bgMagentaBright = wrapperColor('105', '49');
export const bgCyanBright = wrapperColor('106', '49');
export const bgWhiteBright = wrapperColor('107', '49');
