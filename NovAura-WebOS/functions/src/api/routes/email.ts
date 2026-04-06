/**
 * Email Routes
 * POST /email/welcome        — send welcome email
 * POST /email/password-reset — generate Firebase reset link + send email
 * POST /email/test           — SMTP connectivity test (admin use)
 */

import { Router, Request, Response } from 'express';
import { admin } from '../../init';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendTestEmail,
} from '../../services/emailService';

const router = Router();

// POST /email/welcome
router.post('/welcome', async (req: Request, res: Response) => {
  const { email, displayName } = req.body as { email?: string; displayName?: string };
  if (!email) {
    res.status(400).json({ error: 'email required' });
    return;
  }
  try {
    await sendWelcomeEmail(email, displayName || email.split('@')[0]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[POST /email/welcome]', err);
    res.status(500).json({ error: err.message || 'Failed to send welcome email' });
  }
});

// POST /email/password-reset
router.post('/password-reset', async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ error: 'email required' });
    return;
  }
  try {
    // Generate Firebase-hosted reset link
    const resetLink = await admin.auth().generatePasswordResetLink(email);

    // Resolve display name if the user exists
    let displayName = email.split('@')[0];
    try {
      const record = await admin.auth().getUserByEmail(email);
      if (record.displayName) displayName = record.displayName;
    } catch {
      // User record missing — still send the email
    }

    await sendPasswordResetEmail(email, displayName, resetLink);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[POST /email/password-reset]', err);
    res.status(500).json({ error: err.message || 'Failed to send reset email' });
  }
});

// POST /email/test  — quick SMTP check
router.post('/test', async (req: Request, res: Response) => {
  const { to } = req.body as { to?: string };
  if (!to) {
    res.status(400).json({ error: 'to required' });
    return;
  }
  try {
    await sendTestEmail(to);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[POST /email/test]', err);
    res.status(500).json({ error: err.message || 'SMTP test failed' });
  }
});

export default router;
