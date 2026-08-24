import { OAuthApp } from "@octokit/oauth-app";

const githubClient = new OAuthApp({
  clientId: process.env.GITHUB_CLIENT_ID || "",
  clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
  clientType: "oauth-app",
}) as any;

githubClient.getUserDetails = async function (code: string): Promise<any> {
  const { authentication } = await this.createToken({ code });
  const token = authentication.token;

  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `token ${token}` },
  });
  const user = (await userRes.json()) as any;

  let email = user.email;

  if (!email) {
    const emailRes = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `token ${token}` },
    });
    const emails = (await emailRes.json()) as any[];
    email = emails.find((e: any) => e.primary && e.verified)?.email || null;
  }

  return {
    name: user.name || user.login,
    picture: user.avatar_url,
    email,
  };
};


export default githubClient;
