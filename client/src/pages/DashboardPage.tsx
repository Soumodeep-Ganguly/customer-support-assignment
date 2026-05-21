import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/context/SocketContext'
import api from '@/services/api'
import TicketCard from '@/components/TicketCard'
import TicketDetailPanel from '@/pages/TicketDetailPage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { LogOut, Plus, Search, MessageSquare } from 'lucide-react'
import type { Ticket, Pagination } from '@/types'

function Sidebar() {
  const { user, logout } = useAuth()
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const socket = useSocket()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<{ tickets: Ticket[]; messages: any[] } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [searching, setSearching] = useState(false)
  const [fetchError, setFetchError] = useState('')

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    try {
      const res = await api.get(`/tickets?page=${page}&limit=50`)
      setTickets(res.data.tickets)
      setPagination(res.data.pagination)
    } catch {
      setFetchError('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    if (!search.trim()) {
      fetchTickets()
      setSearchResults(null)
    }
  }, [fetchTickets, search])

  useEffect(() => {
    if (!socket) return
    const handler = () => { if (!search.trim()) fetchTickets() }
    socket.on('ticket:new', handler)
    return () => { socket.off('ticket:new', handler) }
  }, [socket, fetchTickets, search])

  const handleSearch = async () => {
    if (!search.trim()) return
    setSearching(true)
    setFetchError('')
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(search)}`)
      setSearchResults(res.data)
    } catch {
      setFetchError('Search failed')
    } finally {
      setSearching(false)
    }
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    setFetchError('')
    try {
      const body: any = { title: newTitle, priority: newPriority }
      if (newCustomerEmail.trim()) {
        body.customerEmail = newCustomerEmail.trim()
      }
      const res = await api.post('/tickets', body)
      setNewTitle('')
      setNewCustomerEmail('')
      setDialogOpen(false)
      navigate(`/dashboard/${res.data.ticket._id}`)
      fetchTickets()
    } catch {
      setFetchError('Failed to create ticket')
    } finally {
      setCreating(false)
    }
  }

  const displayedTickets = searchResults?.tickets ?? tickets

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Tickets</h1>
            <p className="text-xs text-muted-foreground">{user?.name}</p>
          </div>
          <div className="flex gap-1">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Ticket</DialogTitle>
                  <DialogDescription>Describe your issue to create a support ticket.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Brief description of the issue"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newPriority} onValueChange={setNewPriority}>
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">
                      Customer Email <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      placeholder="Assign to existing or new customer"
                      value={newCustomerEmail}
                      onChange={(e) => setNewCustomerEmail(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={creating || !newTitle.trim()}>
                    {creating ? 'Creating...' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-8 h-9 text-sm"
          />
        </div>
        {fetchError && (
          <div className="px-3 pt-2">
            <p className="text-xs text-destructive">{fetchError}</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-1 p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : displayedTickets.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            {search.trim() ? 'No matches.' : 'No tickets yet.'}
          </div>
        ) : (
          <div className="space-y-0.5 p-2">
            {displayedTickets.map((ticket) => (
              <button
                key={ticket._id}
                onClick={() => navigate(`/dashboard/${ticket._id}`)}
                className={`w-full rounded-lg text-left transition-colors ${
                  ticketId === ticket._id ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
              >
                <TicketCard ticket={ticket} compact />
              </button>
            ))}
          </div>
        )}

        {pagination && !search.trim() && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 p-3">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </Button>
            <span className="text-xs text-muted-foreground">
              {pagination.page}/{pagination.totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { ticketId } = useParams()

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className={`w-[380px] shrink-0 border-r bg-card flex-col ${ticketId ? 'hidden md:flex' : 'flex'}`}>
        <Sidebar />
      </aside>
      <main className={`flex flex-1 flex-col overflow-hidden ${ticketId ? 'flex' : 'hidden md:flex'}`}>
        {ticketId ? (
          <TicketDetailPanel />
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p className="text-lg font-medium">Select a ticket</p>
              <p className="text-sm">Choose a ticket from the sidebar to view its conversation</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
