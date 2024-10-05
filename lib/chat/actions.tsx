// @ts-nocheck

import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  createStreamableValue
} from 'ai/rsc'

import { BotCard, BotMessage } from '@/components/stocks'

import { nanoid } from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Message, Chat } from '../types'
import { auth } from '@/auth'
import { format } from 'date-fns'
import { z } from 'zod'
import { BankingSupport } from '@/components/banks/BankingSupport'
import { banks } from '@/components/banks/bankData'
import { sendEmail } from '@/lib/emailSender'

import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Define types for message and chat completion
interface Message {
  role: string
  content: string
}

interface ChatCompletion {
  choices: Array<{
    message?: {
      content: string
      // message?: Message
    }
  }>
}

// Initialize an array to store conversation history
let conversationHistory: Message[] = []

async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState()
  const textStream = createStreamableValue('')
  const spinnerStream = createStreamableUI(<SpinnerMessage />)
  const messageStream = createStreamableUI(null)
  const uiStream = createStreamableUI()

  try {
    console.log("Received message:", content)

    const chatCompletion = await getGroqChatCompletion(content)
    console.log("Generated reply:", chatCompletion)

    let reply = chatCompletion.choices[0]?.message?.content || "No response"
    
    // Add the user's message and the bot's reply to the conversation history
    conversationHistory.push({ role: "user", content: content })
    conversationHistory.push({ role: "assistant", content: reply })

    // Keep only the last 20 messages to prevent the context from becoming too long
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20)
    }

    spinnerStream.done(null)

    // Check if the response includes an email draft
    if (reply.includes('Subject:') && reply.includes('Dear')) {
      const emailDraftMatch = reply.match(/Here's a draft email for you:([\s\S]*)/i)
      if (emailDraftMatch && emailDraftMatch[1]) {
        const emailDraft = emailDraftMatch[1].trim()
        const bankNameMatch = emailDraft.match(/Dear (.*?) Customer Service/)
        if (bankNameMatch && bankNameMatch[1]) {
          const bankName = bankNameMatch[1]
          const bank = banks.find(b => b.name === bankName)

          if (bank) {
            const subjectMatch = emailDraft.match(/Subject: (.*)/)
            const subject = subjectMatch ? subjectMatch[1] : 'Customer Complaint'

            const emailSent = await sendEmail({
              to: bank.email,
              subject: subject,
              text: emailDraft,
              html: emailDraft.replace(/\n/g, '<br>'),
              replyTo: aiState.get().userEmail || ''
            })

            if (emailSent) {
              reply += '\n\nThe email has been sent successfully to ' + bank.name + '.'
            } else {
              reply += '\n\nThere was an error sending the email. Please try again later.'
            }
          }
        }
      }
    }

    aiState.update({
      ...aiState.get(),
      conversationHistory: conversationHistory
    })

    messageStream.update(<BotMessage content={reply} />)

    uiStream.done()
    textStream.done()
    messageStream.done()
  } catch (error) {
    console.error('Error in submitUserMessage:', error)

    let errorMessage = 'An unexpected error occurred. Please try again later.'
    let errorDetails = ''

    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || ''
    }

    if (error instanceof z.ZodError) {
      errorMessage = 'Invalid input data'
      errorDetails = JSON.stringify(error.errors, null, 2)
    }

    console.error('Error details:', {
      message: errorMessage,
      details: errorDetails,
      state: aiState.get()
    })

    uiStream.error(new Error(errorMessage))
    textStream.error(new Error(errorMessage))
    messageStream.error(new Error(errorMessage))

    // Add the error message to the conversation history
    conversationHistory.push({
      role: 'system',
      content: `Error: ${errorMessage}`
    })

    aiState.update({
      ...aiState.get(),
      conversationHistory: conversationHistory
    })
  }

  return {
    id: nanoid(),
    attachments: uiStream.value,
    spinner: spinnerStream.value,
    display: messageStream.value
  }
}

// Function to get Groq chat completion
async function getGroqChatCompletion(userMessage: string): Promise<ChatCompletion> {
  const banksContext = banks.map(bank => 
    `Bank Name: ${bank.name}, Email: ${bank.email}, Phone: ${bank.phone}`
  ).join('\n')

  const systemPrompt = `You are an AI assistant specialized in handling bank-related issues. Your knowledge is limited to the following banks and their contact information:

${banksContext}

Only respond to queries related to these banks. If a user asks about a bank not listed here, politely inform them that you can only assist with the banks mentioned above.

If the user wants to send a complaint email, offer to draft an email for them. Ask which bank they want to complain about and what their specific issue is. Then, create a professional and concise email draft addressing their concern.`

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
  })
}

export type AIState = {
  chatId: string
  interactions?: string[]
  messages: Message[]
  banks: Bank[]
  userEmail?: string
  conversationHistory: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
  spinner?: React.ReactNode
  attachments?: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage
  },
  initialUIState: [],
  initialAIState: {
    chatId: nanoid(),
    interactions: [],
    messages: [],
    banks: banks,
    conversationHistory: []
  },
  onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState()

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  onSetAIState: async ({ state }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, conversationHistory } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`
      const title =
        conversationHistory[0]?.content.substring(0, 100) || 'New Chat'

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages: conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date().toISOString()
        })),
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  if (
    !aiState.conversationHistory ||
    !Array.isArray(aiState.conversationHistory)
  ) {
    // If conversationHistory doesn't exist or isn't an array, return an empty array
    return []
  }
  return aiState.conversationHistory
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'assistant' ? (
          message.content.includes('showBankingSupport') ? (
            <BotCard>
              <BankingSupport />
            </BotCard>
          ) : (
            <BotMessage content={message.content} />
          )
        ) : message.role === 'user' ? (
          <UserMessage showAvatar>{message.content}</UserMessage>
        ) : (
          <BotMessage content={message.content} />
        )
    }))
}