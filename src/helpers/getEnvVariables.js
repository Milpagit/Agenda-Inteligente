/**
 * Devuelve las variables de entorno de React (prefijo REACT_APP_*).
 * Centraliza el acceso para facilitar el testeo con mocks.
 */
export const getEnvVariables = () => {
  return { ...process.env };
};
