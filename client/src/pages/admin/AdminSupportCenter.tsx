'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
    MessageSquare,
    User,
    Search,
    Filter,
    Download,
    Send,
    CheckCircle,
    XCircle,
    Eye,
    Clock,
    AlertCircle,
    Mail,
    Phone,
    RefreshCw,
    ArrowUpDown,
    Users,
    FileText,
    HelpCircle
} from 'lucide-react';

// Firebase
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, update, set, get, push } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyAfjwMO98DIl9XhoAbtWZbLUej1WtCa15k",
    authDomain: "swissgain-a2589.firebaseapp.com",
    databaseURL: "https://swissgain-a2589-default-rtdb.firebaseio.com",
    projectId: "swissgain-a2589",
    storageBucket: "swissgain-a2589.firebasestorage.app",
    messagingSenderId: "1062016445247",
    appId: "1:1062016445247:web:bf559ce1ed7f17e2ca418a",
    measurementId: "G-VTKPWVEY0S"
};

let app: any, database: any;
try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
} catch (e: any) {
    if (e.code === 'app/duplicate-app') {
        app = initializeApp(firebaseConfig, 'AdminSupportApp');
        database = getDatabase(app);
    }
}

interface SupportTicket {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    title: string;
    type: string;
    priority: string;
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    description: string;
    createdAt: string;
    updatedAt: string;
    messages?: TicketMessage[];
    adminNotes?: string;
}

interface TicketMessage {
    id: string;
    sender: 'user' | 'admin';
    message: string;
    timestamp: string;
    adminName?: string;
}

export default function AdminSupportCenter() {
    const { toast } = useToast();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'open' | 'in-progress' | 'resolved'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved' | 'closed'>('all');
    const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
    const [responseMessage, setResponseMessage] = useState('');
    const [adminName, setAdminName] = useState('Admin');
    const [isSubmitting, setIsSubmitting] = useState(false);

    /* ---------- Load All Support Tickets ---------- */
    useEffect(() => {
        const loadAllTickets = async () => {
            try {
                const ticketsRef = ref(database, 'supportTickets');

                const unsubscribe = onValue(ticketsRef, async (snap) => {
                    if (snap.exists()) {
                        const ticketsData = snap.val();
                        const allTickets: SupportTicket[] = [];

                        // Process each user's tickets
                        for (const [userId, userTickets] of Object.entries(ticketsData as any)) {
                            if (userTickets && typeof userTickets === 'object') {
                                for (const [ticketId, ticketData] of Object.entries(userTickets as any)) {
                                    const ticket = ticketData as any;

                                    // Get user details
                                    const userRef = ref(database, `affiliates/${userId}`);
                                    const userSnap = await get(userRef);
                                    const userData = userSnap.exists() ? userSnap.val() : {};

                                    allTickets.push({
                                        id: ticketId,
                                        userId: userId,
                                        userName: userData.name || 'Unknown User',
                                        userEmail: userData.email || 'No Email',
                                        title: ticket.title || 'No Title',
                                        type: ticket.type || 'General Inquiry',
                                        priority: ticket.priority || 'medium',
                                        status: ticket.status || 'open',
                                        description: ticket.description || 'No description',
                                        createdAt: ticket.createdAt || new Date().toISOString(),
                                        updatedAt: ticket.updatedAt || new Date().toISOString(),
                                        messages: ticket.messages || [],
                                        adminNotes: ticket.adminNotes
                                    });
                                }
                            }
                        }

                        // Sort by creation date, newest first
                        allTickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                        setTickets(allTickets);
                    } else {
                        setTickets([]);
                    }
                    setIsLoading(false);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error('Error loading support tickets:', error);
                setIsLoading(false);
            }
        };

        loadAllTickets();
    }, []);

    /* ---------- Filter Tickets ---------- */
    useEffect(() => {
        let filtered = tickets;

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(ticket => ticket.status === statusFilter);
        }

        // Apply priority filter
        if (priorityFilter !== 'all') {
            filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
        }

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(ticket =>
                ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.type.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredTickets(filtered);
    }, [searchTerm, tickets, statusFilter, priorityFilter]);

    /* ---------- Update Ticket Status ---------- */
    const handleUpdateTicketStatus = async (ticketId: string, userId: string, newStatus: SupportTicket['status']) => {
        try {
            const ticketRef = ref(database, `supportTickets/${userId}/${ticketId}`);
            await update(ticketRef, {
                status: newStatus,
                updatedAt: new Date().toISOString()
            });

            toast({
                title: "Status Updated",
                description: `Ticket status changed to ${newStatus.replace('-', ' ')}`,
                variant: "default",
            });

            // Update local state
            setTickets(prev => prev.map(ticket =>
                ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
            ));

            if (selectedTicket && selectedTicket.id === ticketId) {
                setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
            }

        } catch (error) {
            console.error('Error updating ticket status:', error);
            toast({
                title: "Update Failed",
                description: "Failed to update ticket status",
                variant: "destructive",
            });
        }
    };

/* ---------- Send Response ---------- */
const handleSendResponse = async () => {
  if (!selectedTicket || !responseMessage.trim()) {
    toast({
      title: "Error",
      description: "Please enter a response message",
      variant: "destructive",
    });
    return;
  }

  setIsSubmitting(true);

  try {
    const messagesRef = ref(database, `supportTickets/${selectedTicket.userId}/${selectedTicket.id}/messages`);
    const newMessageRef = push(messagesRef);
    
    const newMessage: TicketMessage = {
      id: newMessageRef.key!,
      sender: 'admin',
      message: responseMessage,
      timestamp: new Date().toISOString(),
      adminName: adminName
    };

    // Add message to ticket
    await set(newMessageRef, newMessage);

    // Update ticket timestamp and status if it was open
    const ticketRef = ref(database, `supportTickets/${selectedTicket.userId}/${selectedTicket.id}`);
    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (selectedTicket.status === 'open') {
      updates.status = 'in-progress';
    }

    await update(ticketRef, updates);

    // Update local state - convert messages object to array if needed
    const currentMessages = selectedTicket.messages || {};
    const updatedMessages = {
      ...currentMessages,
      [newMessage.id]: newMessage
    };

    const updatedTicket = {
      ...selectedTicket,
      messages: updatedMessages,
      status: selectedTicket.status === 'open' ? 'in-progress' : selectedTicket.status,
      updatedAt: new Date().toISOString()
    };

    setSelectedTicket(updatedTicket);
    setTickets(prev => prev.map(ticket => 
      ticket.id === selectedTicket.id ? updatedTicket : ticket
    ));

    setResponseMessage("");

    toast({
      title: "Response Sent",
      description: "Your response has been sent to the user",
      variant: "default",
    });

  } catch (error) {
    console.error('Error sending response:', error);
    toast({
      title: "Send Failed",
      description: "Failed to send response",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};

    /* ---------- Get Status Badge ---------- */
    const getStatusBadge = (status: string) => {
        const statusConfig: { [key: string]: { variant: string; class: string; icon: any } } = {
            open: { variant: 'secondary', class: 'bg-blue-100 text-blue-800', icon: Clock },
            'in-progress': { variant: 'default', class: 'bg-yellow-100 text-yellow-800', icon: RefreshCw },
            resolved: { variant: 'default', class: 'bg-green-100 text-green-800', icon: CheckCircle },
            closed: { variant: 'destructive', class: 'bg-gray-100 text-gray-800', icon: CheckCircle }
        };

        const config = statusConfig[status] || statusConfig.open;
        const IconComponent = config.icon;

        return (
            <Badge variant={config.variant as any} className={`${config.class} flex items-center gap-1`}>
                <IconComponent className="h-3 w-3" />
                {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            </Badge>
        );
    };

    /* ---------- Get Priority Badge ---------- */
    const getPriorityBadge = (priority: string) => {
        const priorityConfig: { [key: string]: { class: string; label: string } } = {
            low: { class: 'bg-green-100 text-green-800', label: 'Low' },
            medium: { class: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
            high: { class: 'bg-orange-100 text-orange-800', label: 'High' },
            urgent: { class: 'bg-red-100 text-red-800', label: 'Urgent' }
        };

        const config = priorityConfig[priority] || priorityConfig.medium;

        return (
            <Badge className={config.class}>
                {config.label}
            </Badge>
        );
    };

    /* ---------- Format Date ---------- */
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    /* ---------- Get Time Ago ---------- */
    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    /* ---------- Stats Calculation ---------- */
    const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in-progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        urgent: tickets.filter(t => t.priority === 'urgent').length,
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-700">Loading Support Center...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Support Center</h1>
                        <p className="text-gray-600">Manage and respond to all user support tickets</p>
                    </div>
                    <Button variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                                <FileText className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Open</p>
                                    <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
                                </div>
                                <Clock className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                                    <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                                </div>
                                <RefreshCw className="h-8 w-8 text-yellow-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Resolved</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Urgent</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
                                </div>
                                <AlertCircle className="h-8 w-8 text-red-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                <Card className="mb-6">
                    <CardContent className="p-6">
                        <div className="flex gap-4 flex-col md:flex-row">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search tickets by title, description, user name, or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="open">Open</option>
                                <option value="in-progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>

                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value as any)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Priority</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>

                            <Button variant="outline" className="flex items-center gap-2 whitespace-nowrap">
                                <Filter className="h-4 w-4" />
                                Filter
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Tickets List */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Support Tickets</CardTitle>
                                <CardDescription>
                                    All user support requests and inquiries
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {filteredTickets.length > 0 ? (
                                    <div className="border rounded-lg">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Ticket Info</TableHead>
                                                    <TableHead>User</TableHead>
                                                    <TableHead>Priority</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Created</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredTickets.map((ticket) => (
                                                    <TableRow key={ticket.id} className="hover:bg-gray-50">
                                                        <TableCell>
                                                            <div className="space-y-1">
                                                                <p className="font-semibold">{ticket.title}</p>
                                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                                    {ticket.description}
                                                                </p>
                                                                <Badge variant="outline" className="bg-gray-50">
                                                                    {ticket.type}
                                                                </Badge>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-1">
                                                                <p className="font-medium">{ticket.userName}</p>
                                                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                                                    <Mail className="h-3 w-3" />
                                                                    {ticket.userEmail}
                                                                </div>
                                                                <p className="text-xs text-gray-500">ID: {ticket.userId.substring(0, 8)}...</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {getPriorityBadge(ticket.priority)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {getStatusBadge(ticket.status)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <p className="text-sm text-gray-600">
                                                                {new Date(ticket.createdAt).toLocaleDateString()}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {getTimeAgo(ticket.createdAt)}
                                                            </p>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setSelectedTicket(ticket)}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                                {ticket.status === 'open' && (
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleUpdateTicketStatus(ticket.id, ticket.userId, 'in-progress')}
                                                                        className="bg-blue-600 hover:bg-blue-700"
                                                                    >
                                                                        <RefreshCw className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                                {ticket.status === 'in-progress' && (
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleUpdateTicketStatus(ticket.id, ticket.userId, 'resolved')}
                                                                        className="bg-green-600 hover:bg-green-700"
                                                                    >
                                                                        <CheckCircle className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            No Support Tickets Found
                                        </h3>
                                        <p className="text-gray-600">
                                            {searchTerm ? 'Try adjusting your search terms' : 'No support tickets have been created yet'}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Ticket Details & Response */}
                    <div className="lg:col-span-1">
                        {selectedTicket ? (
                            <Card className="sticky top-4">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5" />
                                        Ticket Details
                                    </CardTitle>
                                    <CardDescription>
                                        {selectedTicket.userName} • {selectedTicket.userEmail}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Ticket Information */}
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-semibold mb-2">Issue</h3>
                                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                                                {selectedTicket.description}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-600">Type</p>
                                                <p className="font-medium">{selectedTicket.type}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Priority</p>
                                                {getPriorityBadge(selectedTicket.priority)}
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Status</p>
                                                {getStatusBadge(selectedTicket.status)}
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Created</p>
                                                <p className="font-medium text-sm">
                                                    {formatDate(selectedTicket.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Messages Thread */}
                                    <div>
                                        <h3 className="font-semibold mb-3">Conversation</h3>
                                        <div className="space-y-4 max-h-[200px] overflow-y-auto">
                                            {/* User's original message */}
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-blue-100 rounded-full">
                                                    <User className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="bg-blue-50 rounded-lg p-3">
                                                        <p className="text-gray-900 text-sm">{selectedTicket.description}</p>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {selectedTicket.userName} • {getTimeAgo(selectedTicket.createdAt)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Response messages */}
                                            {selectedTicket.messages && typeof selectedTicket.messages === 'object' &&
                                                Object.values(selectedTicket.messages).map((message: any) => (
                                                    <div key={message.id} className={`flex items-start gap-3 ${message.sender === 'admin' ? 'flex-row-reverse' : ''}`}>
                                                        <div className={`p-2 rounded-full ${message.sender === 'admin' ? 'bg-green-100' : 'bg-blue-100'
                                                            }`}>
                                                            <User className={`h-4 w-4 ${message.sender === 'admin' ? 'text-green-600' : 'text-blue-600'
                                                                }`} />
                                                        </div>
                                                        <div className={`flex-1 ${message.sender === 'admin' ? 'text-right' : ''}`}>
                                                            <div className={`rounded-lg p-3 ${message.sender === 'admin' ? 'bg-green-50' : 'bg-blue-50'
                                                                }`}>
                                                                <p className="text-gray-900 text-sm">{message.message}</p>
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {message.sender === 'admin' ? (message.adminName || 'Admin') : selectedTicket.userName} • {getTimeAgo(message.timestamp)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    {/* Response Form */}
                                    <div>
                                        <h3 className="font-semibold mb-3">Send Response</h3>
                                        <div className="space-y-3">
                                            <Input
                                                placeholder="Your name..."
                                                value={adminName}
                                                onChange={(e) => setAdminName(e.target.value)}
                                                className="w-full"
                                            />
                                            <Textarea
                                                placeholder="Type your response here..."
                                                value={responseMessage}
                                                onChange={(e) => setResponseMessage(e.target.value)}
                                                rows={3}
                                                className="resize-none"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={handleSendResponse}
                                                    disabled={isSubmitting || !responseMessage.trim()}
                                                    className="flex-1"
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                                            Sending...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="h-4 w-4 mr-2" />
                                                            Send Response
                                                        </>
                                                    )}
                                                </Button>

                                                <select
                                                    value={selectedTicket.status}
                                                    onChange={(e) => handleUpdateTicketStatus(selectedTicket.id, selectedTicket.userId, e.target.value as any)}
                                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="open">Open</option>
                                                    <option value="in-progress">In Progress</option>
                                                    <option value="resolved">Resolved</option>
                                                    <option value="closed">Closed</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Ticket Selected</h3>
                                    <p className="text-gray-600">
                                        Select a ticket from the list to view details and respond
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}