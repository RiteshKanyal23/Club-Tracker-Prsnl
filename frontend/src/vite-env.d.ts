/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public URL of the backend API. Local dev: http://localhost:4000/api/v1. Production: https URL or /api/v1 for the Vercel proxy. */
  readonly VITE_API_BASE_URL?: string;
  /** Public Socket.io origin. Local dev: http://localhost:4000. Production: https URL or /socket.io for the Vercel proxy. */
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_APP_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
