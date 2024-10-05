// import { Ratelimit } from '@upstash/ratelimit'
// import { kv } from '@vercel/kv'
// import { redirect } from 'next/navigation'
// import { headers } from 'next/headers'
// import { Redis } from '@upstash/redis'

// const geminiRatelimit = new Ratelimit({
//   redis: Redis.fromEnv() as unknown as Redis,
//   limiter: Ratelimit.slidingWindow(60, '1 m'),
//   analytics: true,
//   prefix: 'gemini_ratelimit'
// })

// function getIP() {
//   return headers().get('x-real-ip') ?? 'unknown'
// }

// export async function rateLimit() {
//   // const limit = await geminiRatelimit.limit(getIP())
//   // if (!limit.success) {
//   //   redirect('/waiting-room')
//   // }
//   return
// }
