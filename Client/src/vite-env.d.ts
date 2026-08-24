/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_GOOGLE_API_KEY: string;
  readonly VITE_GOOGLE_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const Razorpay: any;

declare namespace google {
  namespace picker {
    const Action: any;
    const DocsView: any;
    const DocsUploadView: any;
    const PickerBuilder: any;
  }
}