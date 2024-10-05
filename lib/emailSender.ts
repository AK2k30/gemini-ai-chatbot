// lib/emailSender.ts

export async function sendEmail({
  to,
  subject,
  text,
  html,
  replyTo
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo: string;
}) {
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to, subject, text, html, replyTo }),
  });

  if (!response.ok) {
    console.error('Error sending email:', await response.text());
    return false;
  }

  return true;
}