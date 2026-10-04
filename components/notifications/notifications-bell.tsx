'use client';

import { useState, useEffect, useRef } from 'react';
import { Notification } from '@/types/database.types';
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from '@/app/actions/notifications';
import { Bell, Check, ExternalLink, Inbox } from 'lucide-react';
import Link from 'next/link';

export function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    const list = await getNotificationsAction();
    setNotifications(list);
    setUnreadCount(list.filter(n => !n.is_read).length);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // 1 min poll
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsReadAction(id);
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsReadAction();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
        title="Notificaciones Internas"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-950 animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/60 p-4 z-50">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Notificaciones</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                  {unreadCount} nuevas
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Marcar todas leídas
              </button>
            )}
          </div>

          <div className="mt-3 max-h-80 overflow-y-auto space-y-2 no-scrollbar">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Inbox className="w-6 h-6 text-slate-600 mx-auto mb-1.5" />
                <p className="text-xs text-slate-500">Sin notificaciones pendientes</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                  className={`p-3 rounded-xl border text-xs transition cursor-pointer ${
                    n.is_read
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-75'
                      : 'bg-indigo-950/20 border-indigo-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className={`font-semibold ${n.is_read ? 'text-slate-300' : 'text-white'}`}>
                      {n.title}
                    </h5>
                    <span className="text-[9px] text-slate-500 whitespace-nowrap">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{n.message}</p>
                  {n.link_url && (
                    <div className="mt-2">
                      <Link
                        href={n.link_url}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                      >
                        Abrir registro <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
