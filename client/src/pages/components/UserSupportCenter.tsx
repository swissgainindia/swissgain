'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
    MessageSquare,
    Phone,
    Mail,
    Clock,
    User,
    HelpCircle,
    FileText,
    Search,
    Plus,
    Filter,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    AlertCircle,
    Clock4,
    ThumbsUp,
    ThumbsDown,
    Star,
    Download,
    Printer,
    Share2,
    Copy,
    ExternalLink,
    Shield,
    CreditCard,
    BarChart3,
    Settings,
    Bug,
    Lightbulb,
    ArrowLeft,
    Send,
    Paperclip,
    Eye
} from 'lucide-react';

// Firebase
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, update, onValue, push } from 'firebase/database';

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
        app = initializeApp(firebaseConfig, 'SupportCenterApp');
        database = getDatabase(app);
    }
}

// Cookie helper
const getCookie = (name: string) => {
    const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return m ? m[2] : null;
};

// Support Ticket Types
const TICKET_TYPES = [
    "Technical Issue",
    "Payment Related",
    "Account Issue",
    "Feature Request",
    "Bug Report",
    "General Inquiry",
    "Security Concern",
    "Partnership Inquiry"
];

// Priority Levels
const PRIORITY_LEVELS = [
    { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
    { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
    { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
    { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800" }
];

// FAQ Categories
const FAQ_CATEGORIES = [
    "Account & Profile",
    "Payments & Withdrawals",
    "Technical Support",
    "Security & Privacy",
    "Features & Usage",
    "Partnership Program"
];

// Sample FAQ Data
const SAMPLE_FAQS = [
    {
        id: 1,
        question: "How do I update my bank details?",
        answer: "You can update your bank details from the Bank Details page in your dashboard. Go to Settings → Bank Details to add or modify your account information.",
        category: "Payments & Withdrawals",
        views: 1245,
        helpful: 98
    },
    {
        id: 2,
        question: "What is the minimum withdrawal amount?",
        answer: "The minimum withdrawal amount is ₹500. You can request withdrawals once your earnings reach this threshold.",
        category: "Payments & Withdrawals",
        views: 876,
        helpful: 87
    },
    {
        id: 3,
        question: "How do I reset my password?",
        answer: "Click on 'Forgot Password' on the login page. We'll send a reset link to your registered email address.",
        category: "Account & Profile",
        views: 543,
        helpful: 76
    },
    {
        id: 4,
        question: "Is my personal information secure?",
        answer: "Yes, we use industry-standard encryption and security measures to protect your data. We never share your information with third parties.",
        category: "Security & Privacy",
        views: 432,
        helpful: 92
    },
    {
        id: 5,
        question: "How can I become a partner?",
        answer: "Visit our Partnership Program page and fill out the application form. Our team will review your application within 2-3 business days.",
        category: "Partnership Program",
        views: 321,
        helpful: 85
    }
];

interface TicketMessage {
    id: string;
    sender: 'user' | 'admin';
    message: string;
    timestamp: string;
    adminName?: string;
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
}

export default function UserSupportCenter() {
    const { toast } = useToast();
    const [userId, setUserId] = useState<string | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("faq");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [newMessage, setNewMessage] = useState("");

    // Support Ticket Form State
    const [ticketForm, setTicketForm] = useState({
        title: '',
        type: '',
        priority: 'medium',
        description: '',
        attachments: [] as string[]
    });

    // Ticket List State
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    /* ---------- Initialize User ---------- */
    useEffect(() => {
        const uid = getCookie('swissgain_uid');
        if (uid) {
            setUserId(uid);
            loadUserData(uid);
            loadUserTickets(uid);
        } else {
            setIsLoading(false);
        }
    }, []);

    /* ---------- Load User Data ---------- */
    const loadUserData = (uid: string) => {
        try {
            const userRef = ref(database, `affiliates/${uid}`);
            onValue(userRef, (snap) => {
                if (snap.exists()) {
                    setUserData(snap.val());
                }
                setIsLoading(false);
            });
        } catch (error) {
            console.error('Error loading user data:', error);
            setIsLoading(false);
        }
    };

    /* ---------- Load User Tickets ---------- */
    const loadUserTickets = (uid: string) => {
        try {
            const ticketsRef = ref(database, `supportTickets/${uid}`);
            onValue(ticketsRef, (snap) => {
                if (snap.exists()) {
                    const ticketsData = snap.val();
                    const ticketsArray = Object.entries(ticketsData).map(([key, value]: [string, any]) => ({
                        id: key,
                        ...value
                    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    setTickets(ticketsArray);
                }
            });
        } catch (error) {
            console.error('Error loading tickets:', error);
        }
    };

    /* ---------- Handle Ticket Form Change ---------- */
    const handleTicketFormChange = (field: string, value: string) => {
        setTicketForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    /* ---------- Submit Support Ticket ---------- */
    const handleSubmitTicket = async () => {
        if (!userId) {
            toast({
                title: "Error",
                description: "User not found. Please refresh the page.",
                variant: "destructive",
            });
            return;
        }

        if (!ticketForm.title || !ticketForm.type || !ticketForm.description) {
            toast({
                title: "Missing Information",
                description: "Please fill in all required fields.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const ticketRef = ref(database, `supportTickets/${userId}`);
            const newTicketRef = push(ticketRef);

            const ticketData = {
                ...ticketForm,
                id: newTicketRef.key,
                userId: userId,
                userName: userData?.name || 'Unknown User',
                userEmail: userData?.email || 'No Email',
                status: 'open',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                messages: []
            };

            await set(newTicketRef, ticketData);

            // Notify admin about new ticket
            await notifyAdminAboutNewTicket(ticketData);

            // Reset form
            setTicketForm({
                title: '',
                type: '',
                priority: 'medium',
                description: '',
                attachments: []
            });

            toast({
                title: "Ticket Submitted Successfully!",
                description: "We'll get back to you within 24 hours.",
                variant: "default",
            });

            // Switch to tickets tab
            setActiveTab("my-tickets");

        } catch (error) {
            console.error('Error submitting ticket:', error);
            toast({
                title: "Submission Failed",
                description: "Failed to submit ticket. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ---------- Send Message in Ticket ---------- */
    const handleSendMessage = async () => {
        if (!selectedTicket || !newMessage.trim()) {
            toast({
                title: "Error",
                description: "Please enter a message",
                variant: "destructive",
            });
            return;
        }

        setIsSendingMessage(true);

        try {
            const messagesRef = ref(database, `supportTickets/${userId}/${selectedTicket.id}/messages`);
            const newMessageRef = push(messagesRef);

            const messageData: TicketMessage = {
                id: newMessageRef.key!,
                sender: 'user',
                message: newMessage,
                timestamp: new Date().toISOString()
            };

            await set(newMessageRef, messageData);

            // Update ticket timestamp
            const ticketRef = ref(database, `supportTickets/${userId}/${selectedTicket.id}`);
            await update(ticketRef, {
                updatedAt: new Date().toISOString()
            });

            // Update local state - convert messages object to array if needed
            const currentMessages = selectedTicket.messages || {};
            const updatedMessages = {
                ...currentMessages,
                [messageData.id]: messageData
            };

            const updatedTicket = {
                ...selectedTicket,
                messages: updatedMessages,
                updatedAt: new Date().toISOString()
            };

            setSelectedTicket(updatedTicket);
            setTickets(prev => prev.map(ticket =>
                ticket.id === selectedTicket.id ? updatedTicket : ticket
            ));

            setNewMessage("");

            toast({
                title: "Message Sent",
                description: "Your message has been sent to support team",
                variant: "default",
            });

        } catch (error) {
            console.error('Error sending message:', error);
            toast({
                title: "Send Failed",
                description: "Failed to send message. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSendingMessage(false);
        }
    };

    /* ---------- Notify Admin About New Ticket ---------- */
    const notifyAdminAboutNewTicket = async (ticketData: any) => {
        try {
            const notificationsRef = ref(database, 'adminNotifications');
            const newNotificationRef = ref(database, 'adminNotifications/supportTickets');

            await update(newNotificationRef, {
                [ticketData.id]: {
                    ticketId: ticketData.id,
                    userId: ticketData.userId,
                    userName: ticketData.userName,
                    userEmail: ticketData.userEmail,
                    title: ticketData.title,
                    type: ticketData.type,
                    priority: ticketData.priority,
                    status: ticketData.status,
                    createdAt: ticketData.createdAt
                }
            });

            console.log('Admin notified about new support ticket');
        } catch (error) {
            console.error('Error notifying admin:', error);
        }
    };

    /* ---------- Get Status Badge ---------- */
    const getStatusBadge = (status: string) => {
        if (!status) {
            return (
                <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
                    <Clock4 className="h-3 w-3" />
                    Unknown
                </Badge>
            );
        }

        const statusConfig: any = {
            'open': { color: 'bg-blue-100 text-blue-800', icon: Clock4 },
            'in-progress': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
            'resolved': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            'closed': { color: 'bg-gray-100 text-gray-800', icon: CheckCircle }
        };

        const config = statusConfig[status] || statusConfig.open;
        const IconComponent = config.icon;

        return (
            <Badge className={`${config.color} flex items-center gap-1`}>
                <IconComponent className="h-3 w-3" />
                {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            </Badge>
        );
    };

    /* ---------- Get Priority Badge ---------- */
    const getPriorityBadge = (priority: string) => {
        const priorityConfig = PRIORITY_LEVELS.find(p => p.value === priority);
        return (
            <Badge className={priorityConfig?.color}>
                {priorityConfig?.label}
            </Badge>
        );
    };

    /* ---------- Filtered FAQs ---------- */
    const filteredFaqs = SAMPLE_FAQS.filter(faq => {
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-700">Loading Support Center...</h2>
                </div>
            </div>
        );
    }

    // If a ticket is selected, show the detailed ticket view
    if (selectedTicket) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
                <div className="mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            variant="outline"
                            onClick={() => setSelectedTicket(null)}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Tickets
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Support Ticket</h1>
                            <p className="text-gray-600">Ticket #{selectedTicket.id.slice(-8)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Ticket Info Sidebar */}
                        <div className="lg:col-span-1">
                            <Card className="border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg">Ticket Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Status</p>
                                        <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Priority</p>
                                        <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Type</p>
                                        <p className="font-medium">{selectedTicket.type}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Created</p>
                                        <p className="font-medium text-sm">{formatDate(selectedTicket.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Last Updated</p>
                                        <p className="font-medium text-sm">{formatDate(selectedTicket.updatedAt)}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Actions */}
                            <Card className="border-0 shadow-lg mt-6">
                                <CardHeader>
                                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button variant="outline" className="w-full justify-start gap-2">
                                        <Download className="h-4 w-4" />
                                        Export Conversation
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start gap-2">
                                        <Printer className="h-4 w-4" />
                                        Print Ticket
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start gap-2">
                                        <Share2 className="h-4 w-4" />
                                        Share Ticket
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Chat Area */}
                        <div className="lg:col-span-3">
                            <Card className="border-0 shadow-lg h-full flex flex-col">
                                <CardHeader className="border-b">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle>{selectedTicket.title}</CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-1">
                                                <User className="h-4 w-4" />
                                                {selectedTicket.userName}
                                                <span className="text-gray-400">•</span>
                                                <Mail className="h-4 w-4" />
                                                {selectedTicket.userEmail}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex-1 p-0">
                                    {/* Messages Area */}
                                    <div className="h-[500px] overflow-y-auto p-6 space-y-6">
                                        {/* Original Ticket Message */}
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-blue-100 rounded-full">
                                                <User className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="bg-blue-50 rounded-lg p-4">
                                                    <p className="text-gray-900">{selectedTicket.description}</p>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {selectedTicket.userName} • {formatDate(selectedTicket.createdAt)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Conversation Messages */}
                                        {selectedTicket.messages && typeof selectedTicket.messages === 'object' &&
                                            Object.values(selectedTicket.messages).map((message: any) => (
                                                <div
                                                    key={message.id}
                                                    className={`flex items-start gap-3 ${message.sender === 'admin' ? 'flex-row-reverse' : ''
                                                        }`}
                                                >
                                                    <div className={`p-2 rounded-full ${message.sender === 'admin' ? 'bg-green-100' : 'bg-blue-100'
                                                        }`}>
                                                        {message.sender === 'admin' ? (
                                                            <User className="h-4 w-4 text-green-600" />
                                                        ) : (
                                                            <User className="h-4 w-4 text-blue-600" />
                                                        )}
                                                    </div>
                                                    <div className={`flex-1 ${message.sender === 'admin' ? 'text-right' : ''}`}>
                                                        <div className={`rounded-lg p-4 ${message.sender === 'admin' ? 'bg-green-50' : 'bg-blue-50'
                                                            }`}>
                                                            <p className="text-gray-900">{message.message}</p>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {message.sender === 'admin' ? (message.adminName || 'Support Agent') : 'You'} • {formatDate(message.timestamp)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}

                                        {/* No Messages Yet */}
                                        {(!selectedTicket.messages || Object.keys(selectedTicket.messages).length === 0) && (
                                            <div className="text-center py-8">
                                                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
                                                <p className="text-gray-600">
                                                    Support team will respond to your ticket soon. You can add additional information below.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Message Input */}
                                    <div className="border-t p-4">
                                        <div className="space-y-3">
                                            <Textarea
                                                placeholder="Type your message here..."
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                rows={3}
                                                className="resize-none"
                                            />
                                            <div className="flex items-center justify-between">
                                                <Button variant="outline" size="sm" className="flex items-center gap-2">
                                                    <Paperclip className="h-4 w-4" />
                                                    Attach File
                                                </Button>
                                                <Button
                                                    onClick={handleSendMessage}
                                                    disabled={isSendingMessage || !newMessage.trim()}
                                                    className="flex items-center gap-2"
                                                >
                                                    {isSendingMessage ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                            Sending...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="h-4 w-4 mr-2" />
                                                            Send Message
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main Support Center View
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <HelpCircle className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Center</h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Get help, report issues, and find answers to common questions. We're here to assist you 24/7.
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 bg-green-100 rounded-full">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">98%</p>
                                <p className="text-sm text-gray-600">Resolution Rate</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 bg-blue-100 rounded-full">
                                <Clock className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">2h</p>
                                <p className="text-sm text-gray-600">Avg. Response Time</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 bg-purple-100 rounded-full">
                                <ThumbsUp className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">95%</p>
                                <p className="text-sm text-gray-600">Satisfaction Rate</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 bg-orange-100 rounded-full">
                                <MessageSquare className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
                                <p className="text-sm text-gray-600">Your Tickets</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4 bg-white p-1 rounded-lg shadow-sm">
                        <TabsTrigger value="faq" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            FAQ
                        </TabsTrigger>
                        <TabsTrigger value="new-ticket" className="flex items-center gap-2 hidden">
                            <Plus className="h-4 w-4" />
                            New Ticket
                        </TabsTrigger>
                        <TabsTrigger value="my-tickets" className="flex items-center gap-2 hidden">
                            <MessageSquare className="h-4 w-4" />
                            My Tickets
                        </TabsTrigger>
                        <TabsTrigger value="contact" className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Contact
                        </TabsTrigger>
                    </TabsList>

                    {/* FAQ Tab */}
                    <TabsContent value="faq" className="space-y-6">
                        <Card className="border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Frequently Asked Questions
                                </CardTitle>
                                <CardDescription>
                                    Find quick answers to common questions
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Search and Filter */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                        <Input
                                            placeholder="Search FAQs..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                        <SelectTrigger className="w-full sm:w-48">
                                            <Filter className="h-4 w-4 mr-2" />
                                            <SelectValue placeholder="All Categories" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {FAQ_CATEGORIES.map(category => (
                                                <SelectItem key={category} value={category}>
                                                    {category}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* FAQ List */}
                                <div className="space-y-3">
                                    {filteredFaqs.map((faq) => (
                                        <Card key={faq.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                                            <CardContent className="p-0">
                                                <button
                                                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                                                    className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 rounded-lg"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-start gap-3">
                                                            <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                                            <div className="flex-1">
                                                                <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                                                                <div className="flex items-center gap-4 mt-1">
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {faq.category}
                                                                    </Badge>
                                                                    <span className="text-xs text-gray-500">
                                                                        {faq.views} views • {faq.helpful}% helpful
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {expandedFaq === faq.id ? (
                                                        <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                                    ) : (
                                                        <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                                    )}
                                                </button>

                                                {expandedFaq === faq.id && (
                                                    <div className="px-4 pb-4 ml-8 border-t pt-4">
                                                        <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                                                        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                                                            <span className="text-sm text-gray-600">Was this helpful?</span>
                                                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                                                                <ThumbsUp className="h-4 w-4" />
                                                                Yes
                                                            </Button>
                                                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                                                                <ThumbsDown className="h-4 w-4" />
                                                                No
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {filteredFaqs.length === 0 && (
                                    <div className="text-center py-8">
                                        <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No FAQs found</h3>
                                        <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                                        <Button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
                                            Clear Filters
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* New Ticket Tab */}
                    <TabsContent value="new-ticket">
                        <Card className="border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Plus className="h-5 w-5" />
                                    Create New Support Ticket
                                </CardTitle>
                                <CardDescription>
                                    Provide detailed information about your issue for faster resolution
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        {/* Ticket Title */}
                                        <div className="space-y-2">
                                            <Label htmlFor="ticketTitle" className="flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Ticket Title *
                                            </Label>
                                            <Input
                                                id="ticketTitle"
                                                placeholder="Brief description of your issue"
                                                value={ticketForm.title}
                                                onChange={(e) => handleTicketFormChange('title', e.target.value)}
                                            />
                                        </div>

                                        {/* Ticket Type */}
                                        <div className="space-y-2">
                                            <Label htmlFor="ticketType" className="flex items-center gap-2">
                                                <HelpCircle className="h-4 w-4" />
                                                Issue Type *
                                            </Label>
                                            <Select
                                                value={ticketForm.type}
                                                onValueChange={(value) => handleTicketFormChange('type', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select issue type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TICKET_TYPES.map((type) => (
                                                        <SelectItem key={type} value={type}>
                                                            {type}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Priority */}
                                        <div className="space-y-2">
                                            <Label htmlFor="priority" className="flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4" />
                                                Priority Level
                                            </Label>
                                            <Select
                                                value={ticketForm.priority}
                                                onValueChange={(value) => handleTicketFormChange('priority', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PRIORITY_LEVELS.map((priority) => (
                                                        <SelectItem key={priority.value} value={priority.value}>
                                                            <div className="flex items-center gap-2">
                                                                <Badge className={priority.color}>
                                                                    {priority.label}
                                                                </Badge>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Description */}
                                        <div className="space-y-2">
                                            <Label htmlFor="description" className="flex items-center gap-2">
                                                <MessageSquare className="h-4 w-4" />
                                                Detailed Description *
                                            </Label>
                                            <Textarea
                                                id="description"
                                                placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable..."
                                                value={ticketForm.description}
                                                onChange={(e) => handleTicketFormChange('description', e.target.value)}
                                                rows={8}
                                                className="resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex gap-4 pt-4">
                                    <Button
                                        onClick={handleSubmitTicket}
                                        disabled={isSubmitting}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <MessageSquare className="h-4 w-4 mr-2" />
                                                Submit Ticket
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {/* Tips */}
                                <Card className="bg-blue-50 border-blue-200">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-blue-900 mb-2">Tips for Faster Resolution</h4>
                                                <ul className="text-sm text-blue-800 space-y-1">
                                                    <li>• Provide clear, step-by-step description of the issue</li>
                                                    <li>• Include relevant screenshots or error messages</li>
                                                    <li>• Mention when the issue started occurring</li>
                                                    <li>• Specify your browser/device if it's technical</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* My Tickets Tab */}
                    <TabsContent value="my-tickets">
                        <Card className="border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5" />
                                    My Support Tickets
                                </CardTitle>
                                <CardDescription>
                                    Track the status of your support requests
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {tickets.length === 0 ? (
                                    <div className="text-center py-8">
                                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets yet</h3>
                                        <p className="text-gray-600 mb-4">Create your first support ticket to get help</p>
                                        <Button onClick={() => setActiveTab("new-ticket")}>
                                            Create New Ticket
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {tickets.map((ticket) => (
                                            <Card key={ticket.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                                                                {getStatusBadge(ticket.status)}
                                                                {getPriorityBadge(ticket.priority)}
                                                            </div>
                                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                                {ticket.description}
                                                            </p>
                                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                                <span className="flex items-center gap-1">
                                                                    <HelpCircle className="h-3 w-3" />
                                                                    {ticket.type}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <MessageSquare className="h-3 w-3" />
                                                                    {ticket.messages ? Object.keys(ticket.messages).length : 0} messages
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <User className="h-3 w-3" />
                                                                    Ticket #{ticket.id.slice(-6)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Button variant="outline" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Contact Tab */}
                    <TabsContent value="contact">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Contact Methods */}
                            <div className="lg:col-span-2">
                                <Card className="border-0 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Phone className="h-5 w-5" />
                                            Contact Methods
                                        </CardTitle>
                                        <CardDescription>
                                            Choose your preferred way to get in touch with us
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Email Support */}
                                        <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="p-2 bg-blue-100 rounded-full">
                                                <Mail className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 mb-1">Email Support</h3>
                                                <p className="text-gray-600 mb-2">Get help via email with detailed responses</p>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                                                        <Mail className="h-4 w-4" />
                                                        support@swissgain.com
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                                                        <Copy className="h-4 w-4" />
                                                        Copy
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">Response time: Within 24 hours</p>
                                            </div>
                                        </div>

                                        {/* Phone Support */}
                                        <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="p-2 bg-green-100 rounded-full">
                                                <Phone className="h-6 w-6 text-green-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 mb-1">Phone Support</h3>
                                                <p className="text-gray-600 mb-2">Speak directly with our support team</p>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                                                        <Phone className="h-4 w-4" />
                                                        +91 1800-123-4567
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                                                        <Copy className="h-4 w-4" />
                                                        Copy
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">Available: Mon-Sun, 9 AM - 6 PM IST</p>
                                            </div>
                                        </div>

                                        {/* Live Chat */}
                                        <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors hidden">
                                            <div className="p-2 bg-purple-100 rounded-full">
                                                <MessageSquare className="h-6 w-6 text-purple-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 mb-1">Live Chat</h3>
                                                <p className="text-gray-600 mb-2">Instant messaging with our support agents</p>
                                                <Button className="bg-purple-600 hover:bg-purple-700 flex items-center gap-1">
                                                    <MessageSquare className="h-4 w-4" />
                                                    Start Live Chat
                                                </Button>
                                                <p className="text-xs text-gray-500 mt-2">Available: 24/7 for urgent issues</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Support Resources */}
                            <div className="space-y-6 hidden">
                                {/* Quick Links */}
                                <Card className="border-0 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <ExternalLink className="h-5 w-5" />
                                            Quick Links
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Button variant="outline" className="w-full justify-start gap-2">
                                            <FileText className="h-4 w-4" />
                                            Documentation
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start gap-2">
                                            <Download className="h-4 w-4" />
                                            Download Resources
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start gap-2">
                                            <Printer className="h-4 w-4" />
                                            Print Guides
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start gap-2">
                                            <Share2 className="h-4 w-4" />
                                            Share Support
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Support Hours */}
                                <Card className="border-0 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Clock className="h-5 w-5" />
                                            Support Hours
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Email Support:</span>
                                                <span className="text-sm font-medium">24/7</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Phone Support:</span>
                                                <span className="text-sm font-medium">9 AM - 6 PM IST</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Live Chat:</span>
                                                <span className="text-sm font-medium">24/7</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Emergency:</span>
                                                <span className="text-sm font-medium">24/7</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Emergency Contact */}
                                <Card className="border-0 shadow-lg bg-red-50 border-red-200">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-red-900">
                                            <AlertCircle className="h-5 w-5" />
                                            Emergency Contact
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-red-800 mb-3">
                                            For critical security issues or system emergencies
                                        </p>
                                        <Button variant="destructive" className="w-full flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            Call Emergency: +91 1800-911-911
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Support Satisfaction */}
                <Card className="mt-8 border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hidden">
                    <CardContent className="p-6 text-center">
                        <div className="max-w-2xl mx-auto">
                            <h3 className="text-xl font-bold mb-2">How was your support experience?</h3>
                            <p className="text-blue-100 mb-4">
                                Help us improve by rating your experience with our support team
                            </p>
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Button
                                        key={star}
                                        variant="outline"
                                        size="icon"
                                        className="bg-white/20 hover:bg-white/30 border-white text-white hover:text-white"
                                    >
                                        <Star className="h-5 w-5" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}