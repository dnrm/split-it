'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Search, 
  Filter, 
  Store, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Eye,
  Users
} from 'lucide-react';
import { SharedTicket, TicketStatus } from '@/types';
import { toast } from 'sonner';

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SharedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/tickets');
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }

      const data = await response.json();
      setTickets(data.tickets || []);

    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'processing':
        return <Badge variant="secondary" className="flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" />Processing</Badge>;
      case 'ready':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Ready</Badge>;
      case 'finalized':
        return <Badge variant="outline" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Finalized</Badge>;
      case 'error':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />Error</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.merchant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesGroup = groupFilter === 'all' || ticket.group_id === groupFilter;
    
    return matchesSearch && matchesStatus && matchesGroup;
  });

  const handleViewTicket = (ticketId: string) => {
    router.push(`/dashboard/tickets/${ticketId}`);
  };

  const handleUploadTicket = () => {
    router.push('/dashboard/expenses?tab=upload');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={fetchTickets}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tickets</h1>
          <p className="text-muted-foreground">
            Manage and claim items from uploaded receipts
          </p>
        </div>
        <Button onClick={handleUploadTicket}>
          <Plus className="h-4 w-4 mr-2" />
          Upload Receipt
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="finalized">Finalized</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={fetchTickets}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Grid */}
      {filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No tickets found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your filters or search terms'
                  : 'Upload your first receipt to get started'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={handleUploadTicket}>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Receipt
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewTicket(ticket.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm truncate">
                      {ticket.merchant_name || 'Unknown Merchant'}
                    </span>
                  </div>
                  {getStatusBadge(ticket.status)}
                </div>
                <CardDescription className="flex items-center gap-2 text-xs">
                  <Clock className="h-3 w-3" />
                  {formatDate(ticket.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">
                      {ticket.total_amount ? formatCurrency(ticket.total_amount) : 'N/A'}
                    </span>
                  </div>
                  
                  {ticket.status === 'ready' && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>Ready for claiming</span>
                    </div>
                  )}
                  
                  {ticket.status === 'finalized' && (
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>Expenses created</span>
                    </div>
                  )}
                  
                  {ticket.status === 'processing' && (
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  )}
                  
                  {ticket.status === 'error' && (
                    <div className="flex items-center gap-2 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      <span>Processing failed</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewTicket(ticket.id);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  
                  {ticket.status === 'ready' && (
                    <Badge variant="outline" className="text-xs">
                      Claim items
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {tickets.length > 0 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{tickets.length}</div>
                <div className="text-sm text-muted-foreground">Total Tickets</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {tickets.filter(t => t.status === 'ready').length}
                </div>
                <div className="text-sm text-muted-foreground">Ready</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {tickets.filter(t => t.status === 'finalized').length}
                </div>
                <div className="text-sm text-muted-foreground">Finalized</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(tickets.reduce((sum, t) => sum + (t.total_amount || 0), 0))}
                </div>
                <div className="text-sm text-muted-foreground">Total Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
