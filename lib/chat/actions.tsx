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
import { z } from 'zod'
import { BankingSupport } from '@/components/banks/BankingSupport'
import { banks } from '@/components/banks/bankData'

// Define types for message and chat completion
interface Message {
  role: string
  content: string
}

interface ChatCompletion {
  choices: Array<{
    message?: {
      content: string
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
    console.log('Received message:', content)

    // Send the user's message to the server
    const response = await fetch('http://localhost:3001/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: content }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from API');
    }

    const data = await response.json();
    const reply = data.reply;

    console.log('Generated reply:', reply);

    // Add the user's message and the bot's reply to the conversation history
    conversationHistory.push({ role: 'user', content: content });
    conversationHistory.push({ role: 'assistant', content: reply });

    // Keep only the last 20 messages to prevent the context from becoming too long
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    spinnerStream.done(null);

    aiState.update({
      ...aiState.get(),
      conversationHistory: conversationHistory,
    });

    // Update the UI to show the bot's reply
    messageStream.update(
      <BotMessage content={reply} showSendButton={false} />
    );

    uiStream.done();
    textStream.done();
    messageStream.done();
  } catch (error) {
    console.error('Error in submitUserMessage:', error);

    let errorMessage = 'An unexpected error occurred. Please try again later.';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error('Error details:', {
      message: errorMessage,
      state: aiState.get(),
    });

    uiStream.error(new Error(errorMessage));
    textStream.error(new Error(errorMessage));
    messageStream.error(new Error(errorMessage));

    // Add the error message to the conversation history
    conversationHistory.push({
      role: 'system',
      content: `Error: ${errorMessage}`,
    });

    aiState.update({
      ...aiState.get(),
      conversationHistory: conversationHistory,
    });
  }

  return {
    id: nanoid(),
    attachments: uiStream.value,
    spinner: spinnerStream.value,
    display: messageStream.value,
  };
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
            <BotMessage
              content={message.content}
              showSendButton={false}
            />
          )
        ) : message.role === 'user' ? (
          <UserMessage showAvatar>{message.content}</UserMessage>
        ) : (
          <BotMessage content={message.content} />
        )
    }))
}