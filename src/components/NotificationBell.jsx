import React, { useState, useEffect } from "react";
import api from "@/api/mentalistClient";
import { Link } from "react-router-dom";
import { Bell, Check, UserPlus, UserCheck, UserX, Award } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("notifications/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    } catch (err) {
      console.error("Erro ao buscar notificações:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Busca novas notificações a cada 15 segundos
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post("notifications/mark-all-read/");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Erro ao marcar notificações como lidas:", err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`notifications/${id}/mark-read/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Erro ao marcar como lida:", err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "friend_request":
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case "friend_accept":
        return <UserCheck className="h-4 w-4 text-emerald" />;
      case "friend_removed":
        return <UserX className="h-4 w-4 text-rose-500" />;
      case "achievement":
        return <Award className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 shadow-lg border-border" align="end">
        <div className="flex items-center justify-between border-b border-border p-3">
          <h4 className="text-xs font-semibold text-foreground">
            Notificações
          </h4>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[10px] font-medium text-primary hover:underline flex items-center gap-1"
            >
              <Check className="h-3 w-3" /> Marcar todas como lidas
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-border">
          {notifications.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">
              Nenhuma notificação por enquanto.
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                className={`flex gap-3 p-3 text-xs transition-colors cursor-pointer ${
                  !n.is_read ? "bg-muted/40 font-medium" : "hover:bg-muted/20"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {getIcon(n.notification_type)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-foreground leading-tight">{n.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    {n.message}
                  </p>
                  {n.target_url && (
                    <Link
                      to={n.target_url}
                      onClick={() => setOpen(false)}
                      className="inline-block pt-1 text-[10px] text-primary hover:underline"
                    >
                      Ver perfil
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
