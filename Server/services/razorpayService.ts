import Razorpay from "razorpay";

const env = (process.env.PAYMENT_ENV || "test").toLowerCase();
const isLive = env === "live";
const keyId = isLive ? process.env.RAZORPAY_LIVE_KEY_ID : process.env.RAZORPAY_TEST_KEY_ID;
const keySecret = isLive ? process.env.RAZORPAY_LIVE_KEY_SECRET : process.env.RAZORPAY_TEST_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error(
    `Razorpay credentials are missing for ${env} mode. Set RAZORPAY_${isLive ? "LIVE" : "TEST"}_KEY_ID and RAZORPAY_${isLive ? "LIVE" : "TEST"}_KEY_SECRET.`
  );
}

export const razorpayInstance = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});