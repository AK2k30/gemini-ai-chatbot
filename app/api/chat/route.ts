import { NextRequest, NextResponse } from 'next/server';
import Groq from "groq-sdk";

// Initialize the Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Call the Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
      model: "llama3-8b-8192",
    });

    // Extract the response
    const response = chatCompletion.choices[0]?.message?.content || "";

    // Return the response
    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}