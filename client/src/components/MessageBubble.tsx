import { Card } from '@/components/ui/card'
import SentimentBadge from './SentimentBadge'
import type { Message } from '@/types'

export default function MessageBubble({ message, isOwn, showSentiment = true }: { message: Message; isOwn: boolean; showSentiment?: boolean }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <Card
        className={`max-w-[75%] px-4 py-2.5 ${
          isOwn
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-xs opacity-60">
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
          {showSentiment && !isOwn && message.role === 'user' && <SentimentBadge sentiment={message.sentiment} />}
        </div>
      </Card>
    </div>
  )
}
