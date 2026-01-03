import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Bell, Trash2, RefreshCw, Upload, Image as ImageIcon, Type, Download, Clock } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const AdminNotifications: React.FC = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<'text' | 'image' | 'both'>('text');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            toast({
                title: 'Error',
                description: 'Failed to load notifications',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (type === 'text' && !message) {
            toast({ title: 'Error', description: 'Message is required for text notifications', variant: 'destructive' });
            return;
        }
        if (type === 'image' && !file) {
            toast({ title: 'Error', description: 'Image is required for image notifications', variant: 'destructive' });
            return;
        }
        if (type === 'both' && (!message || !file)) {
            toast({ title: 'Error', description: 'Message and Image are required', variant: 'destructive' });
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('type', type);
            if (title) formData.append('title', title);
            if (message) formData.append('message', message);
            if (file) formData.append('image', file);

            const res = await fetch('/api/notifications', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                toast({ title: 'Success', description: 'Notification posted successfully' });
                setTitle('');
                setMessage('');
                setFile(null);
                setType('text');
                // Reset file input
                const fileInput = document.getElementById('notification-image') as HTMLInputElement;
                if (fileInput) fileInput.value = '';

                fetchNotifications();
            } else {
                const err = await res.json();
                toast({ title: 'Error', description: err.error || 'Failed to post notification', variant: 'destructive' });
            }
        } catch (error) {
            console.error('Error posting notification:', error);
            toast({ title: 'Error', description: 'Failed to post notification', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this notification?')) return;

        try {
            const res = await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast({ title: 'Success', description: 'Notification deleted' });
                setNotifications(notifications.filter(n => n.id !== id));
            } else {
                toast({ title: 'Error', description: 'Failed to delete notification', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete notification', variant: 'destructive' });
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-4xl font-black text-neutral-900 tracking-tight">University Notifications</h2>
                    <p className="text-neutral-500 mt-2 font-medium">Manage important announcements for students and staff.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={fetchNotifications}
                        className="rounded-xl font-bold bg-white shadow-sm hover:shadow-md transition-all gap-2"
                    >
                        <RefreshCw size={18} className="text-primary" /> Refresh
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Create Notification Form */}
                <Card className="lg:col-span-1 p-6 border-none shadow-sm ring-1 ring-neutral-200/60 bg-white rounded-3xl h-fit">
                    <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Upload size={18} />
                        </div>
                        Post Notification
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-neutral-700">Notification Type</Label>
                            <Select value={type} onValueChange={(v: any) => setType(v)}>
                                <SelectTrigger className="w-full rounded-xl border-neutral-200 focus:ring-primary/20">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text"><div className="flex items-center gap-2"><Type size={16} className="text-blue-500" /> Text Only</div></SelectItem>
                                    <SelectItem value="image"><div className="flex items-center gap-2"><ImageIcon size={16} className="text-emerald-500" /> Image Only</div></SelectItem>
                                    <SelectItem value="both"><div className="flex items-center gap-2"><Bell size={16} className="text-primary" /> Both</div></SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-neutral-700">Title <span className="text-neutral-400 font-normal ml-1">(Optional)</span></Label>
                            <Input
                                placeholder="e.g. Exam Schedule Update"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="rounded-xl border-neutral-200 focus:ring-primary/20"
                            />
                        </div>

                        {(type === 'text' || type === 'both') && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <Label className="text-sm font-semibold text-neutral-700">Message Content</Label>
                                <Textarea
                                    placeholder="Type your important announcement here..."
                                    className="min-h-[120px] rounded-xl border-neutral-200 focus:ring-primary/20 resize-none"
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    required={type === 'text' || type === 'both'}
                                />
                            </div>
                        )}

                        {(type === 'image' || type === 'both') && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <Label className="text-sm font-semibold text-neutral-700">Upload Image</Label>
                                <div className="border-2 border-dashed border-neutral-200 rounded-xl p-4 hover:bg-neutral-50 transition-colors text-center cursor-pointer relative">
                                    <input
                                        id="notification-image"
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setFile(e.target.files?.[0] || null)}
                                        required={type === 'image' || type === 'both'}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                                            <Upload size={20} />
                                        </div>
                                        <p className="text-sm text-neutral-500 font-medium">
                                            {file ? file.name : "Click to upload image"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button type="submit" className="w-full rounded-xl font-bold h-11 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" disabled={loading}>
                            {loading ? (
                                <span className="flex items-center gap-2"><RefreshCw className="animate-spin" size={16} /> Posting...</span>
                            ) : (
                                <span className="flex items-center gap-2"><Bell size={18} /> Post Notification</span>
                            )}
                        </Button>
                    </form>
                </Card>

                {/* Notifications List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                <Bell size={18} />
                            </div>
                            Active Notifications
                        </h3>
                        <span className="text-xs font-bold px-2 py-1 bg-neutral-100 text-neutral-500 rounded-full">
                            {notifications.length} Total
                        </span>
                    </div>

                    {loading && !notifications.length ? (
                        <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
                    ) : notifications.length === 0 ? (
                        <Card className="p-16 text-center border-dashed border-2 border-neutral-200 bg-neutral-50/30 rounded-3xl">
                            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell className="h-8 w-8 text-neutral-300" />
                            </div>
                            <h3 className="text-lg font-bold text-neutral-900">No Notifications</h3>
                            <p className="text-neutral-500 mt-2 max-w-xs mx-auto">Post your first notification to inform students and staff.</p>
                        </Card>
                    ) : (
                        <div className="grid gap-5">
                            {notifications.map((notification) => (
                                <Card key={notification.id} className="p-5 flex flex-col sm:flex-row gap-5 items-start relative overflow-hidden group border-none shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 ring-1 ring-neutral-200/60 hover:ring-primary/20 bg-white rounded-3xl">
                                    {notification.image ? (
                                        <div className="h-40 sm:h-32 w-full sm:w-32 shrink-0 bg-neutral-100 rounded-2xl overflow-hidden border border-neutral-100 relative group-hover:scale-105 transition-transform duration-500">
                                            <img src={notification.image} alt="Notification" className="h-full w-full object-cover" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                        </div>
                                    ) : (
                                        <div className="h-32 w-32 shrink-0 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-100/50 hidden sm:flex">
                                            <Type size={32} />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0 w-full">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${notification.type === 'text' ? 'bg-blue-100 text-blue-700' :
                                                        notification.type === 'image' ? 'bg-emerald-100 text-emerald-700' :
                                                            'bg-purple-100 text-purple-700'
                                                        }`}>
                                                        {notification.type}
                                                    </span>
                                                    <span className="text-xs font-semibold text-neutral-400 flex items-center gap-1">
                                                        <Clock size={12} /> {new Date(notification.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                {notification.title ? (
                                                    <h4 className="font-bold text-lg text-neutral-900 leading-tight group-hover:text-primary transition-colors">{notification.title}</h4>
                                                ) : (
                                                    <h4 className="font-bold text-lg text-neutral-400 italic">Untitled Notification</h4>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-neutral-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors -mr-2 -mt-2"
                                                onClick={() => handleDelete(notification.id)}
                                                title="Delete Notification"
                                            >
                                                <Trash2 size={18} />
                                            </Button>
                                        </div>

                                        {notification.message && (
                                            <p className="text-sm font-medium text-neutral-600 mt-2 leading-relaxed line-clamp-2">
                                                {notification.message}
                                            </p>
                                        )}

                                        {!notification.message && notification.image && (
                                            <p className="text-sm text-neutral-400 italic mt-2">Image only content</p>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminNotifications;
