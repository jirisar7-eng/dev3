import { prisma } from '../db/prisma';

export class SlackIdentityService {
  /**
   * Maps a Slack User ID to our internal User record.
   * If not cached/mapped, fetches the user profile from Slack API via email
   * and links them locally.
   */
  public static async getInternalUserBySlackId(slackUserId: string): Promise<any | null> {
    const slackBotToken = process.env.SLACK_BOT_TOKEN;
    if (!slackBotToken) {
      console.error('[SlackIdentityService] Missing SLACK_BOT_TOKEN for identity mapping');
      return null;
    }

    try {
      // Phase B4: Identity mapping via Slack API users.info -> email
      const response = await fetch(`https://slack.com/api/users.info?user=${slackUserId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${slackBotToken}`,
        },
      });

      if (!response.ok) {
        console.error(`[SlackIdentityService] Failed to fetch Slack user info: HTTP ${response.status}`);
        return null;
      }

      const resJson = await response.json() as any;
      if (!resJson.ok || !resJson.user?.profile?.email) {
        console.error(`[SlackIdentityService] Slack API error or missing email:`, resJson.error || 'No email');
        return null;
      }

      const email = resJson.user.profile.email;

      // Map to internal user via exact email match
      const internalUser = await prisma.user.findUnique({
        where: { email },
        include: {
          roles: {
            include: { role: true }
          }
        }
      });

      if (!internalUser) {
        console.warn(`[SlackIdentityService] No internal user found for Slack email: ${email}`);
        return null;
      }

      return internalUser;
    } catch (err: any) {
      console.error('[SlackIdentityService] Identity mapping crash:', err.message);
      return null;
    }
  }
}
