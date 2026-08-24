import handleActivatedEvent from "./handleActivatedEvent";
import handleCancelledEvent from "./handleCancelledEvent";
import handleChargedEvent from "./handleChargedEvent";
import handlePaymentFailureEvent from "./handlePaymentFailureEvent";
import handlePausedEvent from "./handlePausedEvent";
import handleResumeEvent from "./handleResumeEvent";
import handleHaltedEvent from "./handleHaltedEvent";

async function RazorpayEventHandler(event: string, webhookBody: any): Promise<any> {
  switch (event) {
    case "subscription.activated":
      return handleActivatedEvent(webhookBody);
    case "subscription.cancelled":
      return handleCancelledEvent(webhookBody);
    case "subscription.charged":
      return handleChargedEvent(webhookBody);
    case "subscription.pending":
      return handlePaymentFailureEvent(webhookBody);
    case "subscription.paused":
      return handlePausedEvent(webhookBody);
    case "subscription.resumed":
      return handleResumeEvent(webhookBody);
    case "subscription.halted":
      return handleHaltedEvent(webhookBody);
    default:
      return `Unhandled event: ${event}`;
  }
}

export default {
  RazorpayEventHandler
}