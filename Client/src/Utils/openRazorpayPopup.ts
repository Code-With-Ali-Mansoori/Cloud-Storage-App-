import { toast } from "sonner";
import { confirmSubscription } from "../Apis/subscriptionApi";

declare const Razorpay: any;

export interface OpenRazorpayPopupOptions {
  subscriptionId: string;
  userId: string;
  razorpayMode?: "live" | "test" | string;
}

const getRazorpayKey = (mode?: string) => {
  const normalizedMode = (mode || "test").toLowerCase();

  if (normalizedMode === "live") {
    const liveKey = import.meta.env.VITE_RAZORPAY_LIVE_KEY_ID;
    if (!liveKey) throw new Error("Missing VITE_RAZORPAY_LIVE_KEY_ID in client env");
    return liveKey;
  }

  const testKey = import.meta.env.VITE_RAZORPAY_TEST_KEY_ID;
  if (!testKey) throw new Error("Missing VITE_RAZORPAY_TEST_KEY_ID in client env");
  return testKey;
};

export function openRazorpayPopup({ subscriptionId, userId, razorpayMode }: OpenRazorpayPopupOptions) {
  if (typeof Razorpay === "undefined") {
    toast.error("Razorpay SDK is not loaded", {
      description: "Please refresh the page and try again.",
    });
    return;
  }

  let waitingToastId: string | number | null = null;
  let confirmationAttempts = 0;
  let completed = false;
  let cancelled = false;
  const eventSource = new EventSource(
    `${import.meta.env.VITE_BACKEND_URL}/events?userId=${userId}`
  );

  const finishActivation = (plan?: string) => {
    if (completed) return;
    completed = true;
    if (waitingToastId) toast.dismiss(waitingToastId);
    eventSource.close();
    sessionStorage.setItem(
      "subscription-activation-toast",
      JSON.stringify({ plan })
    );
    window.location.assign("/plans");
  };

  const pollSubscriptionStatus = async () => {
    if (completed || cancelled) return;
    confirmationAttempts += 1;

    let result;
    try {
      result = await confirmSubscription(subscriptionId);
    } catch {
      result = { data: { active: false } };
    }
    if (result.data?.active) {
      finishActivation();
      return;
    }

    if (confirmationAttempts >= 30) {
      if (waitingToastId) toast.dismiss(waitingToastId);
      eventSource.close();
      toast.error("Payment confirmation timed out", {
        description: "Your payment may still be processing. Please refresh shortly.",
        duration: 7000,
      });
      return;
    }

    window.setTimeout(pollSubscriptionStatus, 2000);
  };

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "subscriptionActivated") {
      finishActivation(data.plan);
    }
  };

  eventSource.onerror = (err) => {
    console.error("SSE error:", err);
    eventSource.close();
  };

  const rzp = new Razorpay({
    key: getRazorpayKey(razorpayMode),
    name: "Storage App",
    description: "Subscribe to premium storage plan",
    image: "https://dzdw2zccyu2wu.cloudfront.net/overview/readme-typing.svg",
    subscription_id: subscriptionId,
    handler: function () {
      waitingToastId = toast.loading("Processing payment...", {
        description: "Please wait while we confirm your payment",
        style: {
          background: "#ffffff",
          color: "#1e40af",
          border: "1px solid #e5e7eb",
          borderRadius: "16px",
          boxShadow:
            "0 10px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02)",
          padding: "20px",
          fontWeight: "500",
        },
      });
      void pollSubscriptionStatus();
    },
    modal: {
      ondismiss: function () {
        cancelled = true;
        if (waitingToastId) toast.dismiss(waitingToastId);
        toast.info("Payment window closed", {
          description: "You cancelled the payment process.",
          duration: 4000,
          style: {
            background: "#ffffff",
            color: "#92400e",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            boxShadow:
              "0 10px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02)",
            padding: "20px",
            fontWeight: "500",
          },
        });
        eventSource.close();
      },
    },
  });

  rzp.on("payment.failed", function (response: any) {
    cancelled = true;
    if (waitingToastId) toast.dismiss(waitingToastId);
    toast.error("Payment failed", {
      description: "There was an issue processing your payment",
      action: {
        label: "Retry",
        onClick: () => rzp.open(),
      },
      style: {
        background: "#ffffff",
        color: "#991b1b",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        boxShadow:
          "0 10px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02)",
        padding: "20px",
        fontWeight: "500",
      },
    });
    eventSource.close();
  });

  rzp.open();
}
