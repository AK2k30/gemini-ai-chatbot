import { ExternalLink } from '@/components/external-link'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-2xl bg-zinc-50 sm:p-8 p-4 text-sm sm:text-base">
        <h1 className="text-2xl sm:text-3xl tracking-tight font-semibold max-w-fit inline-block">
          AI-Powered Banking Solutions
        </h1>
        {/* <p className="leading-normal text-zinc-900">
          This is an open source AI chatbot app template built with{' '}
          <ExternalLink href="https://nextjs.org">Next.js</ExternalLink>, the{' '}
          <ExternalLink href="https://sdk.vercel.ai">
            Vercel AI SDK
          </ExternalLink>
          , and{' '}
          <ExternalLink href="https://ai.google.dev">
            Google Gemini
          </ExternalLink>
          .
        </p>
        <p className="leading-normal text-zinc-900">
          It uses{' '}
          <ExternalLink href="https://vercel.com/blog/ai-sdk-3-generative-ui">
            React Server Components
          </ExternalLink>{' '}
          with function calling to mix both text with generative UI responses
          from Gemini. The UI state is synced through the AI SDK so the model is
          always aware of your stateful interactions as they happen in the
          browser.
        </p> */}
        <p className="leading-normal text-zinc-900">
          Welcome to our innovative platform designed to address common banking
          issues using artificial intelligence. Our system combines cutting-edge
          technology with financial expertise to provide efficient and
          personalized solutions.
        </p>
        <ul className="list-disc pl-5 space-y-1 text-zinc-900">
          <li>Fraud detection</li>
          <li>Personalized financial advice</li>
          <li>Automated customer support</li>
          <li>Streamlined loan processing</li>
        </ul>
        {/* <p className="leading-normal text-zinc-900">
          Our goal: Enhance your banking experience with quick, accurate solutions.
        </p> */}
      </div>
    </div>
  )
}
