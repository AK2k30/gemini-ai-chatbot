import type { NextApiRequest, NextApiResponse } from 'next';
import sgMail from '@sendgrid/mail';

const sendGridApiKey = process.env.SENDGRID_API_KEY;
if (!sendGridApiKey) {
  throw new Error("SENDGRID_API_KEY is not defined in the environment variables.");
}

sgMail.setApiKey(sendGridApiKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, text, html, replyTo, bank, draft } = req.body;

  const emailAddresses: { [key: string]: string } = {
    GlobalBank: 'ds45akash2004@gmail.com',
    HDFC: 'hdfc@example.com',
    ICICI: 'icici@example.com',
    Axis: 'axis@example.com',
  };

  const msg = {
    to: to || emailAddresses[bank],
    from: process.env.SENDER_EMAIL || 'akashsunilsingh5555@gmail.com',
    subject: subject || `Issue Regarding ${bank} Bank`,
    text: text || draft,
    html,
    replyTo,
  };

  try {
    await sgMail.send(msg);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
}