'use client'

/* eslint-disable @next/next/no-img-element */

import { GoogleIcon, IconGemini, IconUser } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { spinner } from './spinner'
import { CodeBlock } from '../ui/codeblock'
import { MemoizedReactMarkdown } from '../markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { StreamableValue } from 'ai/rsc'
import { useStreamableText } from '@/lib/hooks/use-streamable-text'
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'
import { useState, useEffect } from 'react'

// Different types of message bubbles.

export function UserMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="group relative flex items-start md:-ml-12">
      <div className="bg-background flex size-[25px] shrink-0 select-none items-center justify-center rounded-lg border shadow-sm">
        <IconUser />
      </div>
      <div className="ml-4 flex-1 space-y-2 overflow-hidden pl-2">
        {children}
      </div>
    </div>
  )
}

function ThinkingAnimation() {
  return (
    <div className="flex items-center space-x-2">
      <div className="h-4 w-4 bg-blue-500 rounded-full animate-bounce"></div>
      <div className="h-4 w-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
      <div className="h-4 w-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    </div>
  )
}

export function BotMessage({
  content,
  className,
  isLoading = false,
  error = null
}: {
  content: string | StreamableValue<string>
  className?: string
  isLoading?: boolean
  error?: Error | null
}) {
  const text = useStreamableText(content)
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })
  const [localError, setLocalError] = useState<Error | null>(error)
  const [processingStep, setProcessingStep] = useState<string>('Initializing')

  useEffect(() => {
    setLocalError(error)
  }, [error])

  useEffect(() => {
    if (isLoading) {
      const steps = [
        'Analyzing request',
        'Processing data',
        'Generating response',
        'Finalizing output'
      ]
      let currentStep = 0
      const interval = setInterval(() => {
        setProcessingStep(steps[currentStep])
        currentStep = (currentStep + 1) % steps.length
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [isLoading])

  return (
    <div className={cn('group relative flex items-start md:-ml-12', className)}>
      <div className="bg-background flex size-[25px] shrink-0 select-none items-center justify-center rounded-lg border shadow-sm">
        <img className="size-6" src="/images/gemini.png" alt="gemini logo" />
      </div>
      <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
        {isLoading ? (
          <div className="flex flex-col items-start space-y-2">
            <ThinkingAnimation />
            <span className="text-sm text-gray-500">{processingStep}...</span>
          </div>
        ) : localError ? (
          <div className="text-red-500">
            <p>An error occurred:</p>
            <p>{localError.message}</p>
            <p className="mt-2 text-sm">Please try again or contact support if the problem persists.</p>
          </div>
        ) : (
          <>
            <MemoizedReactMarkdown
              className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
              remarkPlugins={[remarkGfm, remarkMath]}
              components={{
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>
                },
                code({ node, inline, className, children, ...props }) {
                  if (children.length) {
                    if (children[0] == '▍') {
                      return (
                        <span className="mt-1 animate-pulse cursor-default">▍</span>
                      )
                    }

                    children[0] = (children[0] as string).replace('`▍`', '▍')
                  }

                  const match = /language-(\w+)/.exec(className || '')

                  if (inline) {
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  }

                  return (
                    <CodeBlock
                      key={Math.random()}
                      language={(match && match[1]) || ''}
                      value={String(children).replace(/\n$/, '')}
                      {...props}
                    />
                  )
                }
              }}
            >
              {text}
            </MemoizedReactMarkdown>
            <div className="flex justify-end">
              <button 
                onClick={() => copyToClipboard(text)} 
                className="mt-2 p-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                title={isCopied ? "Copied!" : "Copy message"}
              >
                {isCopied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function BotCard({
  children,
  showAvatar = true
}: {
  children: React.ReactNode
  showAvatar?: boolean
}) {
  return (
    <div className="group relative flex items-start md:-ml-12">
      <div
        className={cn(
          'bg-background flex size-[25px] shrink-0 select-none items-center justify-center rounded-lg border shadow-sm',
          !showAvatar && 'invisible'
        )}
      >
        <img className="size-6" src="/images/gemini.png" alt="gemini logo" />
      </div>
      <div className="ml-4 flex-1 pl-2">{children}</div>
    </div>
  )
}

export function SystemMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={
        'mt-2 flex items-center justify-center gap-2 text-xs text-gray-500'
      }
    >
      <div className={'max-w-[600px] flex-initial p-2'}>{children}</div>
    </div>
  )
}

export function SpinnerMessage() {
  return (
    <div className="group relative flex items-start md:-ml-12">
      <div className="bg-background flex size-[25px] shrink-0 select-none items-center justify-center rounded-lg border shadow-sm">
        <img className="size-6" src="/images/gemini.png" alt="gemini logo" />
      </div>
      <div className="ml-4 h-[24px] flex flex-row items-center flex-1 space-y-2 overflow-hidden px-1">
        {spinner}
      </div>
    </div>
  )
}