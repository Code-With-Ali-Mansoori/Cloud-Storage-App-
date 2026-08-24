import { OAuth2Client } from "google-auth-library";

export const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "postmessage" // Redirect URI...
);

export async function verifyGoogleCode(code: string): Promise<any> {
  try {
    const { tokens } = await client.getToken(code); // tokens includes id_token, access_token
    if (!tokens.id_token) {
      throw new Error("No id_token received from Google");
    }
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
  } catch (error: any) {
    throw new Error("Failed to verify Google code: " + (error?.message || String(error)));
  }
}

