import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    Avatar,
    Divider,
    IconButton,
    Grid
} from '@mui/material'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie
} from 'recharts'
import { ArrowLeft, Users, Activity, MessageCircle, Zap } from 'lucide-react'

const data = [
    { name: 'Mon', messages: 400, users: 240 },
    { name: 'Tue', messages: 300, users: 139 },
    { name: 'Wed', messages: 200, users: 980 },
    { name: 'Thu', messages: 278, users: 390 },
    { name: 'Fri', messages: 189, users: 480 },
    { name: 'Sat', messages: 239, users: 380 },
    { name: 'Sun', messages: 349, users: 430 },
]

const pieData = [
    { name: 'Gemini', value: 400 },
    { name: 'Grok', value: 300 },
    { name: 'KB (RAG)', value: 300 },
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function AdminDashboard({ onBack }: { onBack: () => void }) {
    return (
        <Box sx={{ p: 4, bgcolor: 'background.default', minHeight: '100vh', overflowY: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <IconButton onClick={onBack}><ArrowLeft /></IconButton>
                <Typography variant="h4" fontWeight={700}>System Analytics</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                <Box sx={{ flex: '1 1 calc(25% - 24px)', minWidth: 280 }}>
                    <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}><MessageCircle /></Avatar>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Total Messages</Typography>
                                <Typography variant="h6" fontWeight={700}>1,284</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
                <Box sx={{ flex: '1 1 calc(25% - 24px)', minWidth: 280 }}>
                    <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'success.light', color: 'success.main' }}><Users /></Avatar>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Total Users</Typography>
                                <Typography variant="h6" fontWeight={700}>542</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
                <Box sx={{ flex: '1 1 calc(25% - 24px)', minWidth: 280 }}>
                    <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main' }}><Activity /></Avatar>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Avg Response Time</Typography>
                                <Typography variant="h6" fontWeight={700}>1.2s</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
                <Box sx={{ flex: '1 1 calc(25% - 24px)', minWidth: 280 }}>
                    <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main' }}><Zap /></Avatar>
                            <Box>
                                <Typography variant="caption" color="text.secondary">API Performance</Typography>
                                <Typography variant="h6" fontWeight={700}>99.9%</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: '2 1 calc(66% - 16px)', minWidth: 300 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>Message Traffic</Typography>
                        <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="messages" stroke="#1a73e8" strokeWidth={3} dot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="users" stroke="#34a853" strokeWidth={3} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Box>
                <Box sx={{ flex: '1 1 calc(33% - 16px)', minWidth: 300 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>Provider Usage</Typography>
                        <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </Box>
    )
}
