import sgMail from '@sendgrid/mail';

// Initialize SendGrid with your API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  throw new Error('SENDGRID_API_KEY is not defined in the environment variables');
}

interface EmailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo: string;
}

export async function sendEmail({ to, subject, text, html, replyTo }: EmailParams): Promise<boolean> {
  try {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    if (!fromEmail) {
      throw new Error('SENDGRID_FROM_EMAIL is not defined in the environment variables');
    }

    const msg = {
      to,
      from: fromEmail, // Your verified sender email
      subject,
      text,
      html,
      replyTo
    };

    await sgMail.send(msg);
    console.log('Email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}