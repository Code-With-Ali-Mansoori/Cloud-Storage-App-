import Razorpay from "razorpay";

const env = (process.env.PAYMENT_ENV || "test").toLowerCase();
const mode = env === "live" ? "LIVE" : "TEST";

// RAZORPAY_TEST_APIKEY_ID
// RAZORPAY_TEST_KEY_SECRET

const keyId = process.env[`RAZORPAY_${mode}_APIKEY_ID`];
const keySecret = process.env[`RAZORPAY_${mode}_KEY_SECRET`];

if (!keyId || !keySecret) {
  throw new Error(
    `Razorpay ${mode} credentials are missing.`
  );
};

export const razorpayInstance = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});