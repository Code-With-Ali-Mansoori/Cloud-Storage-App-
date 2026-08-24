import User from "../../models/userModel";


export default async function handleResumeEvent(eventBody: any): Promise<string> {
  const webhookSubscription = eventBody.payload.subscription.entity;
  const userId = webhookSubscription.notes.userId;

  const user = await User.findById(userId);
  if (!user) {
    return "User not found, webhook ignored";
  }

  if (!user.isDeleted) {
    return "User already active, webhook ignored";
  }

  user.isDeleted = false;
  await user.save();

  return "User re-enabled successfully";
}
