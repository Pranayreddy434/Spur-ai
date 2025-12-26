import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Send, Bot, User, Loader2, Plus, MessageSquare, Trash2, Copy, Check, Menu, X, Paperclip, Image as ImageIcon, FileText, BarChart2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { io } from 'socket.io-client'
import AdminDashboard from './components/AdminDashboard'
import {
    ThemeProvider,
    createTheme,
    CssBaseline,
    Box,
    Drawer,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    TextField,
    Button,
    Avatar,
    Paper,
    Divider,
    Tooltip,
    Badge
} from '@mui/material'

const theme = createTheme({
    palette: {
        primary: { main: '#1a73e8' },
        background: { default: '#f8f9fa' },
    },
    typography: {
        fontFamily: "'Inter', sans-serif",
    }
})

interface Message {
    id?: string
    sender: 'user' | 'ai'
    text: string
    attachmentUrl?: string
    attachmentType?: 'image' | 'pdf'
    timestamp?: string
}

interface Conversation {
    id: string
    title: string
    updatedAt: string
}

function App() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const [showAdmin, setShowAdmin] = useState(false)
    const [onlineCount, setOnlineCount] = useState(0)
    const [sessionId, setSessionId] = useState<string | null>(
        localStorage.getItem('chatSessionId')
    )
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const socketRef = useRef<any>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isTyping])

    useEffect(() => {
        fetchConversations()
        if (sessionId) fetchHistory(sessionId)

        // Socket.io Setup
        socketRef.current = io('http://localhost:3001')
        socketRef.current.on('online_count', (count: number) => {
            setOnlineCount(count)
        })

        return () => {
            socketRef.current.disconnect()
        }
    }, [])

    const fetchConversations = async () => {
        try {
            const response = await axios.get('/chat/conversations')
            setConversations(response.data.conversations)
        } catch (error) {
            console.error('Failed to fetch conversations:', error)
        }
    }

    const fetchHistory = async (id: string) => {
        try {
            const response = await axios.get(`/chat/history/${id}`)
            const fixedMessages = response.data.messages.map((m: any) => ({
                ...m,
                text: typeof m.text === 'string' ? m.text : JSON.stringify(m.text)
            }))
            setMessages(fixedMessages)
            setSessionId(id)
            localStorage.setItem('chatSessionId', id)
        } catch (error) {
            console.error('Failed to fetch history:', error)
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                localStorage.removeItem('chatSessionId')
                setSessionId(null)
                setMessages([])
            }
        }
    }

    const retryMessage = async () => {
        const lastUser = [...messages].reverse().find(m => m.sender === "user")
        if (!lastUser) return
        setInput(lastUser.text)
        handleSend()
    }

    const editMessage = (index: number) => {
        setInput(messages[index].text)
        const copy = [...messages]
        copy.splice(index, 1)
        setMessages(copy)
    }

    const handleSend = async () => {
        if ((!input.trim() && !selectedFile) || isLoading) return

        const userMessage: Message = {
            sender: 'user',
            text: input,
            attachmentUrl: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
            attachmentType: selectedFile?.type.startsWith('image/') ? 'image' : 'pdf'
        }
        setMessages(prev => [...prev, userMessage])
        const currentInput = input
        const currentFile = selectedFile
        setInput('')
        setSelectedFile(null)
        setIsLoading(true)

        try {
            const formData = new FormData()
            formData.append('message', currentInput)
            if (sessionId) formData.append('sessionId', sessionId)
            if (currentFile) formData.append('file', currentFile)

            const response = await fetch('/chat/stream', {
                method: 'POST',
                body: formData
            })

            if (!response.body) throw new Error('No body')

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let aiText = ''
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value);
                let parts = buffer.split("\n\n");
                buffer = parts.pop()!;

                parts.forEach(line => {
                    if (!line.startsWith("data: ")) return;
                    const data = line.slice(6);

                    if (data === "[DONE]") return;

                    try {
                        const parsed = JSON.parse(data);

                        if (parsed.sessionId && !sessionId) {
                            setSessionId(parsed.sessionId);
                            localStorage.setItem("chatSessionId", parsed.sessionId);
                            fetchConversations();
                        }

                        if (parsed.type === 'typing') {
                            setIsTyping(parsed.status);
                        }

                        if (parsed.chunk) {
                            aiText += parsed.chunk;
                            setMessages(prev => {
                                const copy = [...prev];
                                const last = copy[copy.length - 1];
                                if (last && last.sender === 'ai' && !messages.find(m => m === last)) {
                                    copy[copy.length - 1] = { sender: "ai", text: aiText };
                                    return copy;
                                } else {
                                    return [...prev, { sender: "ai", text: aiText }];
                                }
                            })
                        }
                    } catch { }
                })
            }
        } catch (error) {
            console.error('Failed to send message:', error)
            setMessages(prev => [
                ...prev,
                { sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' }
            ])
        } finally {
            setIsLoading(false)
            setIsTyping(false)
        }
    }

    const startNewChat = () => {
        setSessionId(null)
        setMessages([])
        localStorage.removeItem('chatSessionId')
    }

    const deleteChat = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!window.confirm('Are you sure you want to delete this chat?')) return
        try {
            await axios.delete(`/chat/conversation/${id}`)
            fetchConversations()
            if (sessionId === id) startNewChat()
        } catch (error) {
            console.error('Failed to delete chat:', error)
        }
    }

    const copyToClipboard = (text: string, msgId: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(msgId)
        setTimeout(() => setCopiedId(null), 2000)
    }

    if (showAdmin) return <AdminDashboard onBack={() => setShowAdmin(false)} />

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', height: '100vh' }}>
                {/* Sidebar */}
                <Drawer
                    variant="persistent"
                    anchor="left"
                    open={isSidebarOpen}
                    sx={{
                        width: isSidebarOpen ? 320 : 0,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': { width: 320, boxSizing: 'border-box' },
                    }}
                >
                    <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}><Bot size={24} /></Avatar>
                        <Typography variant="h6" fontWeight={700}>Spur Support</Typography>
                    </Box>

                    <Box sx={{ px: 2, mb: 2 }}>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<Plus size={18} />}
                            onClick={startNewChat}
                            sx={{ borderRadius: 2, py: 1.5 }}
                        >
                            New Chat
                        </Button>
                    </Box>

                    <Divider />

                    <List sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
                        {conversations.map((conv) => (
                            <ListItem key={conv.id} disablePadding sx={{ mb: 0.5 }}>
                                <ListItemButton
                                    selected={sessionId === conv.id}
                                    onClick={() => fetchHistory(conv.id)}
                                    sx={{ borderRadius: 2 }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        <MessageSquare size={18} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={conv.title || 'Untitled Chat'}
                                        primaryTypographyProps={{ variant: 'body2', fontWeight: 500, noWrap: true }}
                                    />
                                    <IconButton size="small" onClick={(e) => deleteChat(conv.id, e)}>
                                        <Trash2 size={14} />
                                    </IconButton>
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>

                    <Divider />
                    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 8, height: 8, bgcolor: 'success.main', borderRadius: '50%' }} />
                            <Typography variant="caption">{onlineCount} users online</Typography>
                        </Box>
                        <Tooltip title="Admin Dashboard">
                            <IconButton size="small" onClick={() => setShowAdmin(true)}><BarChart2 size={18} /></IconButton>
                        </Tooltip>
                    </Box>
                </Drawer>

                {/* Main Content */}
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
                    <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Toolbar>
                            <IconButton onClick={() => setIsSidebarOpen(!isSidebarOpen)} edge="start" sx={{ mr: 2 }}>
                                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                            </IconButton>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ flexGrow: 1 }}>
                                {sessionId ? conversations.find(c => c.id === sessionId)?.title || 'Chat' : 'New Helper Request'}
                            </Typography>
                        </Toolbar>
                    </AppBar>

                    {/* Messages */}
                    <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {messages.length === 0 && (
                            <Box sx={{ textAlign: 'center', mt: 10 }}>
                                <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}><Bot size={32} /></Avatar>
                                <Typography variant="h5" fontWeight={700}>How can we help you today?</Typography>
                                <Typography color="text.secondary">Spur AI support is ready to assist you in real-time.</Typography>
                            </Box>
                        )}

                        {messages.map((msg, index) => (
                            <Box key={index} sx={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        bgcolor: msg.sender === 'user' ? 'primary.main' : 'background.paper',
                                        color: msg.sender === 'user' ? 'white' : 'text.primary',
                                        border: msg.sender === 'ai' ? '1px solid' : 'none',
                                        borderColor: 'divider',
                                        borderBottomRightRadius: msg.sender === 'user' ? 4 : 12,
                                        borderBottomLeftRadius: msg.sender === 'ai' ? 4 : 12,
                                    }}
                                >
                                    {msg.attachmentUrl && (
                                        <Box sx={{ mb: 1 }}>
                                            {msg.attachmentType === 'image' ? (
                                                <img
                                                    src={msg.attachmentUrl.startsWith('blob:') ? msg.attachmentUrl : `http://localhost:3001${msg.attachmentUrl}`}
                                                    alt="Attachment"
                                                    style={{ maxWidth: '100%', borderRadius: 8 }}
                                                />
                                            ) : (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(0,0,0,0.05)', p: 1, borderRadius: 1 }}>
                                                    <FileText size={20} />
                                                    <Typography variant="caption">PDF Document</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                    <Typography variant="body2" component="div" className="prose">
                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                    </Typography>
                                </Paper>
                                <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5, px: 1 }}>
                                    <Button
                                        size="small"
                                        sx={{ minWidth: 0, p: 0, textTransform: 'none', fontSize: 11 }}
                                        onClick={() => copyToClipboard(msg.text, index.toString())}
                                    >
                                        {copiedId === index.toString() ? 'Copied' : 'Copy'}
                                    </Button>
                                    {msg.sender === 'ai' && (
                                        <Button size="small" sx={{ minWidth: 0, p: 0, textTransform: 'none', fontSize: 11 }} onClick={retryMessage}>Retry</Button>
                                    )}
                                    {msg.sender === 'user' && (
                                        <Button size="small" sx={{ minWidth: 0, p: 0, textTransform: 'none', fontSize: 11 }} onClick={() => editMessage(index)}>Edit</Button>
                                    )}
                                </Box>
                            </Box>
                        ))}

                        {isTyping && (
                            <Box sx={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 24, height: 24 }}><Bot size={14} /></Avatar>
                                <Typography variant="caption" fontStyle="italic" color="text.secondary">Assistant is typing...</Typography>
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Input */}
                    <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        {selectedFile && (
                            <Paper variant="outlined" sx={{ mb: 2, p: 1, display: 'inline-flex', alignItems: 'center', gap: 1, borderRadius: 2 }}>
                                {selectedFile.type.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
                                <Typography variant="caption" sx={{ maxWidth: 200 }} noWrap>{selectedFile.name}</Typography>
                                <IconButton size="small" onClick={() => setSelectedFile(null)}><X size={14} /></IconButton>
                            </Paper>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                style={{ display: 'none' }}
                                accept="image/*,.pdf"
                            />
                            <IconButton onClick={() => fileInputRef.current?.click()} color="primary">
                                <Paperclip size={20} />
                            </IconButton>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="Write a message..."
                                size="small"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                disabled={isLoading}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 24,
                                        bgcolor: '#f1f3f4',
                                        '& fieldset': { border: 'none' }
                                    }
                                }}
                            />
                            <IconButton
                                onClick={handleSend}
                                color="primary"
                                disabled={isLoading || (!input.trim() && !selectedFile)}
                                sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                            </IconButton>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    )
}

export default App
