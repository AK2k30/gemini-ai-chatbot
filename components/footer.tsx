import React from 'react'

import { cn } from '@/lib/utils'
import { ExternalLink } from '@/components/external-link'

export function FooterText({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    // <p
    //   className={cn(
    //     'px-2 text-center text-xs leading-normal text-zinc-500',
    //     className
    //   )}
    //   {...props}
    // >
    //   Open source AI chatbot built with{' '}
    //   <ExternalLink href="https://cloud.google.com/vertex-ai">
    //     Google Gemini
    //   </ExternalLink>
    //   , <ExternalLink href="https://nextjs.org">Next.js</ExternalLink> and{' '}
    //   <ExternalLink href="https://github.com/vercel/ai">
    //     Vercel AI SDK
    //   </ExternalLink>
    //   .
    // </p>
    <p
      className={cn(
        'px-2 text-center text-xs leading-normal text-zinc-500',
        className
      )}
      {...props}
    >
      AI can make error please check the response,{' '}
      <ExternalLink href="https://cloud.google.com/vertex-ai">
        learn more
      </ExternalLink>
      . <ExternalLink href="https://nextjs.org">Privacy Policy</ExternalLink> and{' '}
      <ExternalLink href="https://github.com/vercel/ai">
        Terms of Service
      </ExternalLink>
      .
    </p>
  )
}
