import React from 'react';
import { Bell, Check, Link as LinkIcon } from 'lucide-react';
import { notificationsApi, type InboxNotification } from '@/lib/notifications-api';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

function useNotificationsPoll(intervalMs = 45000) {
  const [items, setItems] = React.useState<InboxNotification[]>([]);
  const [open, setOpen] = React.useState(false);
  const fetchAll = React.useCallback(async () => {
    try {
      const list = await notificationsApi.list();
      setItems(list);
    } catch (e) {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, intervalMs);
    return () => clearInterval(id);
  }, [fetchAll, intervalMs]);

  const unreadCount = items.filter(i => !i.read).length;

  const markRead = async (id: string, read = true) => {
    await notificationsApi.markRead(id, read);
    setItems(prev => prev.map(i => (i.id === id ? { ...i, read } : i)));
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setItems(prev => prev.map(i => ({ ...i, read: true })));
  };

  return { items, unreadCount, markRead, markAllRead, open, setOpen };
}

export default function NotificationsInbox() {
  const { items, unreadCount, markRead, markAllRead, open, setOpen } = useNotificationsPoll();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[92vw] max-w-sm md:w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Inbox</span>
            <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
              <Check className="w-4 h-4 mr-1" /> Mark all read
            </Button>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {items.length === 0 ? (
            <div className="text-sm text-gray-500">No notifications yet.</div>
          ) : (
            items.map(n => (
              <div key={n.id} className={`border rounded p-3 ${n.read ? 'bg-white' : 'bg-blue-50'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">{n.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{n.message}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                    {n.link && (
                      <a href={n.link} className="inline-flex items-center text-xs text-blue-600 mt-2" onClick={()=>setOpen(false)}>
                        <LinkIcon className="w-3 h-3 mr-1" /> View
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {!n.read && (
                      <Button size="xs" variant="ghost" onClick={() => markRead(n.id)}>
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
