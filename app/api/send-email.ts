import type { NextApiRequest, NextApiResponse } from 'next';
import sgMail from '@sendgrid/mail';

const sendGridApiKey = process.env.SENDGRID_API_KEY;
if (!sendGridApiKey) {
  console.error('SENDGRID_API_KEY is not defined in the environment variables.');
}

sgMail.setApiKey(sendGridApiKey || '');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bank, emailContent } = req.body;

  const emailAddresses: { [key: string]: string } = {
    GlobalBank: 'ds45akash2004@gmail.com',
    HDFC: 'hdfc@example.com',
    ICICI: 'icici@example.com',
    Axis: 'axis@example.com',
  };

  // Extract subject and body from the emailContent
  const subjectMatch = emailContent.match(/Subject: (.+?)(?:\n|$)/);
  const subject = subjectMatch ? subjectMatch[1].trim() : `Issue Regarding ${bank} Bank`;
  const body = emailContent.replace(/Subject: .+?\n/, '').trim();

  const msg = {
    to: emailAddresses[bank],
    from: process.env.SENDER_EMAIL || 'akashsunilsingh5555@gmail.com',
    subject: subject,
    text: body,
    html: body.replace(/\n/g, '<br>'),
  };

  try {
    if (!sendGridApiKey) {
      throw new Error('SendGrid API key is not configured');
    }
    const [response] = await sgMail.send(msg);
    console.log('SendGrid API Response:', response);
    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('Error sending email:', error);
    let errorMessage = 'Failed to send email';
    let errorDetails = {};

    if (error.response) {
      console.error('SendGrid API error response:', error.response.body);
      errorMessage = `SendGrid API error: ${error.code || 'Unknown error'}`;
      try {
        // Attempt to parse the error response body as JSON
        errorDetails = JSON.parse(error.response.body);
      } catch (parseError) {
        // If parsing fails, use the response body as a string
        errorDetails = { rawResponse: error.response.body };
      }
    } else {
      errorMessage = error.message || errorMessage;
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: errorDetails,
    });
  }
}