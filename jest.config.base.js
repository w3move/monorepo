// jest.config.base.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'], // Busca código en src y tests en tests
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage', // Directorio para guardar reportes de coverage
  coverageReporters: ['text', 'lcov'], // Formatos de reporte (lcov para HTML)
  // moduleNameMapper: { // Descomenta y configura si usas alias de TS paths
  //   '^@libs/(.*)$': '<rootDir>/../../libs/$1/src', // Ajusta la ruta relativa según dónde esté jest.config.base.js
  // },
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Si necesitas un archivo de setup global para tests
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        // Asegura usar el tsconfig del paquete bajo test
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  // Indica a Jest que busque los package.json para resolver módulos dentro del monorepo
  // Esto puede ser útil si los paquetes se importan entre sí
  moduleDirectories: ['node_modules'],
};
