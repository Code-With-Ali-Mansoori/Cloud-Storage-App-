import express from "express";
import { cancelSubscription, changePlan, checkSubscripitonStatus, confirmSubscription, createSubscription, plansEligibleforChange } from "../controllers/subscriptionControllers";

// Subscription Router
const router = express.Router();

// Create Subscription
router.post("/create", createSubscription);

// Check subscription status
router.get("/status", checkSubscripitonStatus);

// Confirm a successful checkout when webhook delivery is delayed.
router.post("/confirm", confirmSubscription);

// Cancel the subscription & revoke the access.
router.delete("/cancel", cancelSubscription)

// Change plan (Downgrade || Upgrade)
router.post("/changePlan", changePlan);

router.get("/change-eligibility", plansEligibleforChange)

export default router;
