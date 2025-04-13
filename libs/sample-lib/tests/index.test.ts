import { MENSAJE_SALUDO, sumar } from '../src/index';

describe('sample-lib', () => {
  describe('sumar function', () => {
    it('debería sumar dos números correctamente', () => {
      expect(sumar(2, 3)).toBe(5);
      expect(sumar(-1, 1)).toBe(0);
      expect(sumar(0, 0)).toBe(0);
    });

    it('debería manejar tipos no numéricos devolviendo 0 y mostrando un warning', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(sumar('a' as any, 3)).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Se esperaba recibir números'
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('MENSAJE_SALUDO constant', () => {
    it('debería tener el valor correcto', () => {
      expect(MENSAJE_SALUDO).toBe('Hola desde sample-lib!');
    });
  });
});
