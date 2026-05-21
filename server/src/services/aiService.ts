import Groq from 'groq-sdk'
import { config } from '../config/env'
import type { Sentiment } from '../types'

const groq = new Groq({ apiKey: config.groqApiKey })

const MODEL = 'llama-3.3-70b-versatile'

export async function generateSuggestedReplies(
  ticketTitle: string,
  conversationHistory: { role: string; content: string }[]
): Promise<string[]> {
  const conversationText = conversationHistory
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n')

  const messages = [
    {
      role: 'system' as const,
      content: `You are a professional customer support agent. Generate 3 distinct, helpful, and empathetic replies to the customer's last message. Consider the full conversation context and ticket title.

Return exactly 3 options separated by the line: ---SEPARATOR---

Each option must be a single line — no line breaks inside an option. Vary the tone slightly between options (e.g., formal, friendly, concise). Keep each option under 150 words. Do not number or label the options.`,
    },
    {
      role: 'user' as const,
      content: `Ticket: "${ticketTitle}"\n\nConversation:\n${conversationText}\n\nGenerate 3 support reply options separated by ---SEPARATOR---:`,
    },
  ]

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.8,
    max_tokens: 800,
  })

  const raw = completion.choices[0]?.message?.content || ''
  const parts = raw.split('---SEPARATOR---').map((s) => s.trim().replace(/\n+/g, ' ')).filter(Boolean)

  if (parts.length >= 3) return parts.slice(0, 3)
  if (parts.length > 0) return parts

  return [
    'We have received your message and are looking into it. Our team will get back to you shortly.',
    'Thank you for reaching out. We understand your concern and are working on a resolution.',
    'We appreciate your patience. Your issue has been escalated to the relevant team.',
  ]
}

export async function analyzeSentiment(text: string): Promise<Sentiment> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content:
          'Classify the sentiment of the following customer message as one of: positive, negative, neutral, urgent. Respond with only the single word label.',
      },
      { role: 'user', content: text },
    ],
    temperature: 0.1,
    max_tokens: 10,
  })

  const label = completion.choices[0]?.message?.content?.trim().toLowerCase() as Sentiment | undefined

  if (label && ['positive', 'negative', 'neutral', 'urgent'].includes(label)) {
    return label
  }

  return 'neutral'
}

export async function summarizeConversation(
  messages: { role: string; content: string }[]
): Promise<string> {
  const conversationText = messages.map((m) => `${m.role}: ${m.content}`).join('\n')

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content:
          'Summarize the following customer support conversation in 2-3 sentences. Focus on the issue, key details, and resolution if any.',
      },
      { role: 'user', content: conversationText },
    ],
    temperature: 0.3,
    max_tokens: 200,
  })

  return completion.choices[0]?.message?.content || 'Unable to generate summary.'
}
