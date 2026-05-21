import { Badge } from '@/components/ui/badge'
import type { Ticket } from '@/types'

const statusVariants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  open: 'default',
  in_progress: 'secondary',
  resolved: 'outline',
  closed: 'destructive',
}

const priorityColors: Record<string, string> = {
  low: 'text-muted-foreground',
  medium: 'text-yellow-600',
  high: 'text-red-600',
}

export default function TicketCard({ ticket, compact }: { ticket: Ticket; compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{ticket.title}</p>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className={priorityColors[ticket.priority]}>{ticket.priority}</span>
            <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <Badge variant={statusVariants[ticket.status]} className="shrink-0 text-[10px] px-1.5 py-0">
          {ticket.status === 'in_progress' ? 'progress' : ticket.status}
        </Badge>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium">{ticket.title}</h3>
        <Badge variant={statusVariants[ticket.status]} className="shrink-0">
          {ticket.status.replace('_', ' ')}
        </Badge>
      </div>
      <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
        <span className={priorityColors[ticket.priority]}>
          {ticket.priority} priority
        </span>
        <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
      </div>
    </div>
  )
}
