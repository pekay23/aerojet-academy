"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Send, Search, Users, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';

type Recipient = { id: string; name: string; email: string; role: string };

export default function CommunicationClient() {
    const [target, setTarget] = useState('ALL_STUDENTS');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [sentCount, setSentCount] = useState(0);

    // Custom selection state
    const [allUsers, setAllUsers] = useState<Recipient[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        if (target === 'CUSTOM') {
            fetchAllUsers();
        }
    }, [target]);

    const fetchAllUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await fetch('/api/staff/communication/recipients');
            const data = await res.json();
            setAllUsers(data.recipients || []);
        } catch { toast.error("Failed to load users"); }
        finally { setLoadingUsers(false); }
    };

    const toggleUser = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const filteredUsers = allUsers.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const roleColor: Record<string, string> = {
        STUDENT: 'bg-blue-100 text-blue-700',
        INSTRUCTOR: 'bg-purple-100 text-purple-700',
        STAFF: 'bg-green-100 text-green-700',
        ADMIN: 'bg-red-100 text-red-700',
    };

    const handleSend = async () => {
        if (!subject || !message) { toast.error("Fill in subject and message"); return; }
        if (target === 'CUSTOM' && selectedIds.length === 0) { toast.error("Select at least one recipient"); return; }

        setSending(true);
        try {
            const res = await fetch('/api/staff/communication', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, message, target, selectedIds })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setSent(true);
            setSentCount(data.count);
            toast.success(`Sent to ${data.count} recipient(s)!`);
        } catch (err: any) { toast.error(err.message || "Send failed"); }
        finally { setSending(false); }
    };

    const handleReset = () => {
        setSent(false);
        setSubject('');
        setMessage('');
        setSelectedIds([]);
        setSentCount(0);
    };

    if (sent) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Card className="max-w-md w-full text-center">
                    <CardContent className="pt-8 pb-8 space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold">Message Sent!</h3>
                        <p className="text-muted-foreground">
                            Successfully delivered to <strong>{sentCount}</strong> recipient{sentCount !== 1 ? 's' : ''}.
                        </p>
                        <Button onClick={handleReset} className="mt-4">Send Another</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Communication</h1>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Compose Panel */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Compose Message</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Target Audience</label>
                                <Select value={target} onValueChange={setTarget}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL_STUDENTS">All Students</SelectItem>
                                        <SelectItem value="APPLICANTS">Applicants Only</SelectItem>
                                        <SelectItem value="STAFF">All Staff & Instructors</SelectItem>
                                        <SelectItem value="CUSTOM">Select Individuals...</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Subject</label>
                                <Input
                                    placeholder="e.g. Important Exam Schedule Update"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Message</label>
                                <Textarea
                                    placeholder="Write your message here..."
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    rows={8}
                                />
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <div className="text-sm text-muted-foreground">
                                    {target === 'CUSTOM'
                                        ? `${selectedIds.length} recipient(s) selected`
                                        : `Sending to: ${target.replace(/_/g, ' ').toLowerCase()}`}
                                </div>
                                <Button onClick={handleSend} disabled={sending} className="gap-2">
                                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Send Message
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Custom Recipient Picker */}
                {target === 'CUSTOM' && (
                    <div>
                        <Card className="sticky top-4">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="w-5 h-5" /> Select Recipients
                                </CardTitle>
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or email..."
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {loadingUsers ? (
                                    <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
                                ) : (
                                    <>
                                        {selectedIds.length > 0 && (
                                            <div className="px-4 py-2 border-b bg-blue-50 flex items-center justify-between">
                                                <span className="text-sm font-medium text-blue-700">{selectedIds.length} selected</span>
                                                <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => setSelectedIds([])}>
                                                    <X className="w-3 h-3 mr-1" /> Clear
                                                </Button>
                                            </div>
                                        )}
                                        <div className="max-h-[400px] overflow-y-auto divide-y">
                                            {filteredUsers.map(user => (
                                                <div
                                                    key={user.id}
                                                    className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors
                            ${selectedIds.includes(user.id) ? 'bg-blue-50/50' : ''}`}
                                                    onClick={() => toggleUser(user.id)}
                                                >
                                                    <Checkbox checked={selectedIds.includes(user.id)} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{user.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                    </div>
                                                    <Badge variant="outline" className={`text-[10px] ${roleColor[user.role] || ''}`}>
                                                        {user.role}
                                                    </Badge>
                                                </div>
                                            ))}
                                            {filteredUsers.length === 0 && (
                                                <div className="p-8 text-center text-muted-foreground text-sm">No users found.</div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
