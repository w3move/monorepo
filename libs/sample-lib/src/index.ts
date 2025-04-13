/**
 * Función de ejemplo que suma dos números.
 * @param a Primer número
 * @param b Segundo número
 * @returns La suma de a y b
 */
export function sumar(a: number, b: number): number {
  if (typeof a !== 'number' || typeof b !== 'number') {
    console.warn('Se esperaba recibir números');
    return 0; // O lanzar un error, según prefieras
  }
  return a + b;
}

/**
 * Constante de ejemplo
 */
export const MENSAJE_SALUDO = 'Hola desde sample-lib!';
