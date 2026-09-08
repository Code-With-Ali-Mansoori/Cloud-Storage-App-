import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ModalProvider } from "./Contexts/ModalContext";
import Modals from "./Contexts/ModalContainer";
import { AuthProvider } from "./Contexts/AuthContext";
import { StorageProvider } from "./Contexts/StorageContext";
import { ProgressProvider } from "./Contexts/ProgressContext";
import { GlobalUploadProgress } from "./components/GlobalUploadProgess";
import { toast, Toaster } from "sonner";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

function SubscriptionActivationToast() {
  useEffect(() => {
    const activationToast = sessionStorage.getItem("subscription-activation-toast");
    if (!activationToast) return;

    sessionStorage.removeItem("subscription-activation-toast");

    try {
      const { plan } = JSON.parse(activationToast);
      toast.success("Your subscription is now active!", {
        description: `You now have access to ${plan || "your new plan"} features`,
        duration: 5000,
      });
    } catch {
      toast.success("Your subscription is now active!", { duration: 5000 });
    }
  }, []);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <ModalProvider>
          <ProgressProvider>
            <StorageProvider>
              <App />
              <Toaster
                position="top-right"
                richColors
                closeButton
                expand={false}
                offset={{ bottom: '0px', right: "10px", left: "0px", top: "90px" }}
                mobileOffset={{ top: "60px" }}
              />
              <SubscriptionActivationToast />
               <Toaster id="error" position="top-right" richColors />
              <Modals />
              <GlobalUploadProgress />
            </StorageProvider>
          </ProgressProvider>
        </ModalProvider>
      </GoogleOAuthProvider>
    </AuthProvider>
  </StrictMode>
);
