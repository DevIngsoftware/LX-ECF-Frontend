/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_USE_MOCKS?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_CHAT_API_PATH?: string;
  readonly VITE_LOADEXPRESS_URL?: string;
  readonly VITE_CONTACT_EMAIL?: string;
  readonly VITE_CONTACT_PHONE?: string;
  readonly VITE_CONTACT_WHATSAPP?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
