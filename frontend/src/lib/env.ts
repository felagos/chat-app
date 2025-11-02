export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  WS_URL: import.meta.env.VITE_WS_URL || 'http://localhost:3000',
  NODE_ENV: import.meta.env.MODE || 'development',
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
} as const;

export default ENV;
