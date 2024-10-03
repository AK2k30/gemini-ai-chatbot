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
import { Chat } from '../types'
import { auth } from '@/auth'
import { format } from 'date-fns'
import { streamText } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'
import { BankingSupport } from '@/components/banks/BankingSupport'
import { rateLimit } from './ratelimit'
import { sendEmail } from '@/app/api/send-email/route'
import { banks } from '@/components/banks/bankData'

async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState()
  const textStream = createStreamableValue('')
  const spinnerStream = createStreamableUI(<SpinnerMessage />)
  const messageStream = createStreamableUI(null)
  const uiStream = createStreamableUI()

  try {
    await rateLimit()

    aiState.update({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: nanoid(),
          role: 'user',
          content: `${aiState.get().interactions.join('\n\n')}\n\n${content}`
        }
      ]
    })

    const history = aiState.get().messages.map(message => ({
      role: message.role,
      content: message.content
    }))

    const result = await streamText({
      model: google('models/gemini-1.5-flash'),
      temperature: 0,
      tools: {
        showBankingSupport: {
          description: 'Show the UI for banking support issues.',
          parameters: z.object({
            reason: z.string().optional()
          })
        },
        sendEmailOnBehalfOfUser: {
          description:
            'Send a formal email on behalf of the user to their bank.',
          parameters: z.object({
            bankEmail: z.string(),
            userQuery: z.string(),
            emailContent: z.string()
          })
        },
        provideSupportPhone: {
          description: 'Provide a support phone number for the user.',
          parameters: z.object({
            phoneNumber: z.string()
          })
        }
      },
      system: `\
You are a highly specialized banking assistant with extensive knowledge of all banking-related issues, procedures, and information. Your primary function is to assist users with their banking queries and problems. You have access to comprehensive information about all banks, including their customer care email addresses and phone numbers.

Key points:
1. You ONLY have knowledge about banking and cannot assist with non-banking topics.
2. If a user's query is not related to banking, politely inform them that you cannot help and can only address banking-related issues.
3. You can provide detailed solutions for all types of banking problems.
4. When asked to send an email on behalf of the user, craft a formal, detailed email addressing their banking query, show it to the user for approval, and then use the sendEmailOnBehalfOfUser function to send it.

The date today is ${format(new Date(), 'd LLLL, yyyy')}. 

Here's the flow:
1. Understand the user's banking issue.
2. Provide initial guidance or information.
3. Offer to connect the user with customer support if needed.
4. If requested, draft and send formal emails to the bank on behalf of the user.
5. If requested, provide a support phone number for the user.

Available banks and their contact information:
${banks.map(bank => `- ${bank.name}: Email: ${bank.email}, Phone: ${bank.phone}`).join('\n')}

When providing bank contact information, use the data from this list.
    `,
      messages: [...history]
    })

    let textContent = ''
    spinnerStream.done(null)

    for await (const delta of result.fullStream) {
      const { type } = delta

      if (type === 'text-delta') {
        const { textDelta } = delta
        textContent += textDelta
        messageStream.update(<BotMessage content={textContent} />)

        aiState.update({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content: textContent
            }
          ]
        })
      } else if (type === 'tool-call') {
        const { toolName, args } = delta

        switch (toolName) {
          case 'showBankingSupport':
            uiStream.update(
              <BotCard>
                <BankingSupport />
              </BotCard>
            )
            aiState.done({
              ...aiState.get(),
              interactions: [],
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content:
                    "Here's our banking support interface. Please select the issue you're experiencing.",
                  display: {
                    name: 'showBankingSupport',
                    props: {}
                  }
                }
              ]
            })
            break
          case 'provideSupportEmail':
            const { email } = args
            aiState.done({
              ...aiState.get(),
              interactions: [],
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: `You can reach our customer support team via email at: ${email}`
                }
              ]
            })
            break
          case 'provideSupportPhone':
            const { phoneNumber } = args
            aiState.done({
              ...aiState.get(),
              interactions: [],
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: `You can reach our customer support team by phone at: ${phoneNumber}`
                }
              ]
            })
            break
          case 'sendEmailOnBehalfOfUser':
            const { bankEmail, userQuery, emailContent, userEmail } = args
            const emailSubject = `Customer Query: ${userQuery.substring(0, 50)}...`
            const emailHtml = `<p>${emailContent.replace(/\n/g, '<br>')}</p>`

            const emailSent = await sendEmail({
              to: bankEmail,
              subject: emailSubject,
              text: emailContent,
              html: emailHtml,
              replyTo: userEmail
            })

            if (emailSent) {
              aiState.done({
                ...aiState.get(),
                interactions: [],
                messages: [
                  ...aiState.get().messages,
                  {
                    id: nanoid(),
                    role: 'assistant',
                    content: `I've drafted and sent the following email on your behalf to ${bankEmail}:\n\n${emailContent}\n\nThe email has been sent successfully.`
                  }
                ]
              })
            } else {
              aiState.done({
                ...aiState.get(),
                interactions: [],
                messages: [
                  ...aiState.get().messages,
                  {
                    id: nanoid(),
                    role: 'assistant',
                    content: `I apologize, but there was an error sending the email. Please try again later or contact support if the issue persists.`
                  }
                ]
              })
            }
            break

          default:
            console.warn(`Unhandled tool call: ${toolName}`)
        }
      }
    }

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

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: nanoid(),
          role: 'system',
          content: `Error: ${errorMessage}`
        }
      ]
    })
  }

  return {
    id: nanoid(),
    attachments: uiStream.value,
    spinner: spinnerStream.value,
    display: messageStream.value
  }
}

export type Message = {
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool'
  content: string
  id?: string
  name?: string
  display?: {
    name: string
    props: Record<string, any>
  }
}

export type AIState = {
  chatId: string
  interactions?: string[]
  messages: Message[]
  banks: Bank[]
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
  initialAIState: { chatId: nanoid(), interactions: [], messages: [], banks: banks },
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
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`
      const title = messages[0].content.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'assistant' ? (
          message.display?.name === 'showBankingSupport' ? (
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
