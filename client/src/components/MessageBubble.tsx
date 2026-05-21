import { Card } from '@/components/ui/card'
import SentimentBadge from './SentimentBadge'
import type { Message } from '@/types'

export default function MessageBubble({ message, isOwn, showSentiment = true }: { message: Message; isOwn: boolean; showSentiment?: boolean }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <Card
        className={`max-w-[75%] px-4 py-2.5 ${
          message.role === 'ai'
            ? 'bg-muted'
            : isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
        }`}
      >
        {message.role === 'ai' && (
          <p className="mb-1 text-xs font-medium text-muted-foreground">AI Assistant</p>
        )}
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
