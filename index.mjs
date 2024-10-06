import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import sendgridMail from "@sendgrid/mail";

// Load environment variables from .env file
dotenv.config();

// Initialize SendGrid
sendgridMail.setApiKey(process.env.SENDGRID_API_KEY);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const app = express();
const port = process.env.PORT || 3001;

// Middleware to parse JSON requests
app.use(express.json());

// Configure CORS to allow requests from the frontend
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend's URL if needed
  methods: ['POST'], // Allow POST requests
  allowedHeaders: ['Content-Type'], // Specify allowed headers
}));

// Define the banks context
const banks = [
  { name: "Abc bank", email: "ds45akash2004@gmail.com", phone: "1-800-123-4567" },
  { name: "Bank B", email: "help@bankb.com", phone: "1-888-765-4321" },
  // Add more banks as needed
];

// Generate the banks context dynamically
const banksContext = banks
  .map(
    (bank) =>
      `Bank Name: ${bank.name}, Email: ${bank.email}, Phone: ${bank.phone}`
  )
  .join('\n');

// Define the system prompt for the Groq model
const systemPrompt = `You are an AI assistant specialized in handling bank-related issues for the following banks:

${banksContext}

Your responsibilities:
1. Only respond to queries related to these banks. If a user asks about a bank not listed here or any non-banking topic, politely inform them that you can only assist with banking matters for the listed banks.
2. If the user wants to send a complaint email, offer to draft an email for them. Ask which bank they want to complain about and what their specific issue is.
3. When drafting an email, create a professional and concise email draft addressing their concern. Then, present the draft to the user for review.
4. After presenting the draft, ask the user if they want to send the email as is, make changes, or cancel sending.
5. If the user requests changes, apply the changes and show the updated draft for approval.
6. Only proceed with sending the email after explicit user approval.
7. Do not engage in conversations or provide information about topics unrelated to banking or the listed banks.

When drafting an email, use the following format:
Subject: [Brief description of the issue]
Dear [Bank Name] Customer Service,

[Body of the email addressing the user's specific complaint or inquiry]

Sincerely,
[User's Name (to be filled by the user)]`;

// Initialize an array to store conversation history
let conversationHistory = [];

// A temporary store for email details before user approval
let pendingEmail = {};

// Route for chat
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    console.log("Received message:", message);

    // Check if the user replied "send" to approve email sending
    if (message.toLowerCase().trim() === 'send') {
      if (pendingEmail.subject && pendingEmail.body && pendingEmail.to) {
        await sendEmail(pendingEmail.to, pendingEmail.subject, pendingEmail.body);
        res.json({ reply: `Email sent to ${pendingEmail.to}.`, emailSent: true });

        // Clear pending email after sending
        pendingEmail = {};
      } else {
        res.json({ reply: "No pending email to send.", emailSent: false });
      }
      return; // Stop further processing since the email was handled
    }

    // Get response from the chat model
    const chatCompletion = await getGroqChatCompletion(message);
    console.log("Generated reply:", chatCompletion);

    let reply = chatCompletion.choices[0]?.message?.content || "No response";

    // Add the user's message and the bot's reply to the conversation history
    conversationHistory.push({ role: "user", content: message });
    conversationHistory.push({ role: "assistant", content: reply });

    // Keep only the last 20 messages to prevent the context from becoming too long
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    // Check if the bot's reply contains email information
    const emailMatch = reply.match(
      /Subject: (.+?)(?:\n|$)([\s\S]*?)(?:Sincerely,[\s\S]*?$)/
    );
    console.log("Email match:", emailMatch);

    if (emailMatch) {
      const subject = emailMatch[1].trim();
      const body = emailMatch[2].trim() + '\n\nSincerely,\n[Your Name]';

      // Extract bank name from the email body
      const bankNameMatch = body.match(/Dear (.+?) Customer Service,/);
      const bankName = bankNameMatch ? bankNameMatch[1] : null;

      if (bankName) {
        const bank = banks.find(b => b.name.toLowerCase() === bankName.toLowerCase());
        if (bank) {
          // Store the email information temporarily
          pendingEmail = { to: bank.email, subject, body };

          // Show email content to the user and ask for approval
          res.json({ 
            reply: `Here is the email I am about to send to ${bank.name}:\n\nTo: ${bank.email}\nSubject: ${subject}\n\n${body}\n\nIf you want to send this email, reply with 'send'.`, 
            emailReadyForApproval: true 
          });
        } else {
          res.json({ reply: `I'm sorry, but I couldn't find ${bankName} in my list of supported banks. Can you please specify a bank from the list I provided earlier?`, emailSent: false });
        }
      } else {
        res.json({ reply: "I'm sorry, but I couldn't determine which bank to send the email to. Can you please specify the bank name?", emailSent: false });
      }
    } else {
      res.json({ reply }); // If no email content, just send the reply
    }
  } catch (error) {
    console.error("Error in /chat route:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Function to get Groq chat completion
async function getGroqChatCompletion(userMessage) {
  return groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      // Include the conversation history
      ...conversationHistory,
      // Add the new user message
      {
        role: "user",
        content: userMessage,
      },
    ],
    model: "llama3-8b-8192",
  });
}

// Function to send an email
async function sendEmail(to, subject, text) {
  const msg = {
    to,
    from: process.env.EMAIL_FROM, // Use your verified sender email
    subject,
    text,
  };

  try {
    await sendgridMail.send(msg);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error.response?.body || error);
  }
}

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});