import redisClient from "../../config/redis";
import User from "../../models/userModel";


export default async function handlePausedEvent(eventBody: any): Promise<string> {
  const webhookSubscription = eventBody.payload.subscription.entity;
  const userId = webhookSubscription.notes.userId;

  const user = await User.findById(userId);
  if (!user) {
    return "User not found, webhook ignored";
  }

  try {
    await redisClient.deleteManySessions(user._id.toString());
  } catch (error) {
    console.error("Error deleting user sessions:", error);
  }

  if (user.isDeleted) {
    return "User already disabled, webhook ignored";
  }

  user.isDeleted = true;
  await user.save();
  return "User disabled successfully";
}