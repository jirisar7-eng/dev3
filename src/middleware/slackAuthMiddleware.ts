import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function verifySlackSignature(req: Request, res: Response, next: NextFunction) {
  const slackSignature = req.headers['x-slack-signature'] as string;
  const slackRequestTimestamp = req.headers['x-slack-request-timestamp'] as string;

  if (!slackSignature || !slackRequestTimestamp) {
    res.status(401).send('Missing Slack signature headers');
    return;
  }

  // Check for replay attacks (5 minutes)
  const time = Math.floor(new Date().getTime() / 1000);
  if (Math.abs(time - parseInt(slackRequestTimestamp, 10)) > 300) {
    res.status(401).send('Replay attack detected');
    return;
  }

  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    console.error('[SlackAuth] SLACK_SIGNING_SECRET is not configured');
    res.status(500).send('Server configuration error');
    return;
  }

  const rawBody = (req as any).rawBody || '';
  const sigBaseString = `v0:${slackRequestTimestamp}:${rawBody}`;
  const mySignature = 'v0=' + crypto.createHmac('sha256', signingSecret).update(sigBaseString, 'utf8').digest('hex');

  try {
    const myBuffer = Buffer.from(mySignature, 'utf8');
    const slackBuffer = Buffer.from(slackSignature, 'utf8');
    if (myBuffer.length !== slackBuffer.length) {
      res.status(401).send('Invalid signature');
      return;
    }
    if (crypto.timingSafeEqual(myBuffer, slackBuffer)) {
      next();
    } else {
      res.status(401).send('Invalid signature');
      return;
    }
  } catch (e) {
    res.status(401).send('Signature validation error');
    return;
  }
}
