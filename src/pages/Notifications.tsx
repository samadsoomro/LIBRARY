import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Image as ImageIcon, FileText, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface Notification {
    id: string;
    title?: string;
    message?: string;
    image?: string;
    type: 'text' | 'image' | 'both';
    createdAt: string;
}

const NotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
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

    return (
        <motion.div
            className="min-h-screen pt-20 pb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="bg-gradient-to-br from-secondary to-background py-12 lg:py-16 text-center">
                <div className="container">
                    <motion.h1
                        className="text-3xl lg:text-4xl font-bold text-foreground mb-4"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        College Notifications
                    </motion.h1>
                    <motion.p
                        className="text-lg text-muted-foreground max-w-2xl mx-auto"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        Important announcements, press releases, and updates from GCMN Library.
                    </motion.p>
                </div>
            </div>

            <div className="container py-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Clock className="w-12 h-12 text-primary animate-pulse mb-4" />
                        <p className="text-muted-foreground">Loading notifications...</p>
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="max-w-4xl mx-auto space-y-8">
                        {notifications.map((notification, index) => (
                            <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <Card className="overflow-hidden border-border/50 shadow-lg hover:shadow-xl transition-shadow bg-card">
                                    {/* Image Only or Both */}
                                    {(notification.type === 'image' || notification.type === 'both') && notification.image && (
                                        <div className="w-full relative">
                                            <img
                                                src={notification.image}
                                                alt={notification.title || "Notification Image"}
                                                className="w-full h-auto max-h-[500px] object-contain bg-black/5"
                                            />
                                        </div>
                                    )}

                                    {/* Text Only or Both */}
                                    {(notification.type === 'text' || notification.type === 'both') && (
                                        <div className="p-6 lg:p-8 space-y-4">
                                            <div className="flex items-center gap-2 text-primary font-medium text-sm">
                                                <Bell className="w-4 h-4" />
                                                {new Date(notification.createdAt).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>

                                            {notification.title && (
                                                <h2 className="text-2xl font-bold text-foreground">
                                                    {notification.title}
                                                </h2>
                                            )}

                                            {notification.message && (
                                                <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-wrap">
                                                    {notification.message}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Image Only but no text content, still show date if needed or just leave clean */}
                                    {notification.type === 'image' && !notification.title && !notification.message && (
                                        <div className="px-6 py-4 flex items-center justify-end border-t border-border/30 bg-muted/20">
                                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                                <Clock className="w-3 h-3" />
                                                {new Date(notification.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                            </div>
                                        </div>
                                    )}

                                </Card>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border">
                        <Bell className="w-16 h-16 mx-auto text-muted-foreground opacity-20 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Notifications</h3>
                        <p className="text-muted-foreground">There are no new notifications at this time.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default NotificationsPage;
