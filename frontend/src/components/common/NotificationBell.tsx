import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, CheckCheck, Clock, Heart, ShieldCheck, Users, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { resolveNotificationRoute, AppNotification } from '@/utils/notificationRouter';

export type { AppNotification };

export function NotificationBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);

  const { data: notifications = [], isLoading } = useQuery<AppNotification[]>({
    queryKey: ['my-notifications'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: AppNotification[]; meta: any }>('/notifications');
      return Array.isArray(res) ? res : res?.data || [];
    },
    refetchInterval: 30000, // Background fallback polling every 30s
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiClient.patch('/notifications/read-all', {}),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.read) {
      markReadMutation.mutate(n._id);
    }
    setOpen(false);

    const targetRoute = resolveNotificationRoute(n, user?.role || 'USER');
    navigate(targetRoute);
  };

  const getIcon = (type: string) => {
    if (type.includes('DONATION')) return <Heart className="w-4 h-4 text-rose-500 shrink-0" />;
    if (type.includes('VOLUNTEER')) return <Users className="w-4 h-4 text-blue-500 shrink-0" />;
    if (type.includes('NGO')) return <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />;
    return <AlertCircle className="w-4 h-4 text-primary shrink-0" />;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full text-neutral-600 hover:text-neutral-900 cursor-pointer"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-extrabold text-white animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 shadow-2xl rounded-2xl border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-50/80 border-b">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-neutral-900">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary font-bold">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="text-xs text-primary hover:underline font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[380px] overflow-y-auto divide-y divide-neutral-100">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-neutral-500">Checking notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="py-12 px-4 text-center text-neutral-500 space-y-2">
              <Bell className="w-8 h-8 text-neutral-300 mx-auto" />
              <p className="text-sm font-medium text-neutral-700">All caught up!</p>
              <p className="text-xs text-neutral-400">Updates regarding your contributions and applications will show up here.</p>
            </div>
          ) : (
            notifications.slice(0, 15).map((n) => (
              <button
                key={n._id}
                type="button"
                onClick={() => handleNotificationClick(n)}
                className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors hover:bg-neutral-50 cursor-pointer ${
                  !n.read ? 'bg-primary/5' : 'bg-white'
                }`}
              >
                <div className="p-2 rounded-xl bg-white border shrink-0 shadow-xs mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-xs font-semibold truncate ${!n.read ? 'text-neutral-900' : 'text-neutral-700'}`}>
                      {n.title}
                    </p>
                    <span className="text-[10px] text-neutral-400 shrink-0">
                      {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                </div>
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0 self-center" />
                )}
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
