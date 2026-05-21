import { Badge } from '@/components/ui/badge'

const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  positive: 'default',
  negative: 'destructive',
  neutral: 'secondary',
  urgent: 'outline',
}

export default function SentimentBadge({ sentiment }: { sentiment: string }) {
  const variant = variants[sentiment] || 'secondary'
  return <Badge variant={variant}>{sentiment}</Badge>
}
