import type { NextApiRequest, NextApiResponse } from 'next'
import sgMail from '@sendgrid/mail'
import { banks } from '@/components/banks/bankData'

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
} else {
  console.error('SENDGRID_API_KEY is not defined in the environment variables')
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { bankName, emailContent } = req.body

  if (!bankName || !emailContent) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  const bank = banks.find(b => b.name === bankName)

  if (!bank) {
    return res.status(400).json({ message: 'Invalid bank name' })
  }

  const msg = {
    to: bank.email,
    from: 'akashsunilsingh5555@gmail.com', // Use your verified sender email
    subject: 'Customer Inquiry',
    text: emailContent,
    html: emailContent.replace(/\n/g, '<br>'),
  }

  try {
    await sgMail.send(msg)
    res.status(200).json({ message: 'Email sent successfully' })
  } catch (error: unknown) {
    console.error('Error sending email:', error)
    let errorMessage = 'Error sending email'
    
    if (error instanceof Error) {
      errorMessage = error.message
      if ('response' in error && error.response) {
        const sendGridError = error as { response: { body: any, statusCode: number, request: any } }
        console.error('SendGrid API response:', sendGridError.response.body)
        errorMessage = `SendGrid Error: ${JSON.stringify(sendGridError.response.body)}`
        
        if (sendGridError.response.statusCode === 404) {
          console.error('404 Not Found Error. This could indicate an invalid API endpoint, non-existent resource, or misconfigured API key.')
          console.error('Request details:', {
            method: sendGridError.response.request.method,
            url: sendGridError.response.request.url,
            headers: sendGridError.response.request.headers,
            body: sendGridError.response.request.body
          })
        }
      }
    }
    
    console.error('Error details:', JSON.stringify(error, null, 2))
    res.status(500).json({ message: errorMessage })
  }
}