/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the backend API. Defaults to '/api' (same-origin, proxied) if unset. */
  readonly VITE_API_URL?: string;
  /**
   * WhatsApp number (digits only, with country code, e.g. "14155238886")
   * that the "Chat on WhatsApp" button on the Home page links to via
   * wa.me. Leave unset to show a "Coming soon" state instead of a dead
   * link — set once your Twilio WhatsApp sender is live.
   */
  readonly VITE_WHATSAPP_NUMBER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
