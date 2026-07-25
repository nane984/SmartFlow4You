import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { roleInList, TENDER_DEFINITION_ROLES } from "../../auth/roles";
import { getEffectiveRole } from "../../auth/accessUtils";
import {
    getTenderNotificationUnreadCount,
    getTenderNotifications,
    markAllTenderNotificationsRead,
    markTenderNotificationRead,
} from "../../modules/tenderDefinitions/tenderDefinition.api";
import type { TenderNotification } from "../../modules/tenderDefinitions/tenderDefinition.types";
import { cn } from "../ui/cn";

function formatWhen(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

/** Topbar bell for tender import notifications (Admin + Tender roles). */
export default function TenderNotificationBell() {
    const navigate = useNavigate();
    const role = getEffectiveRole();
    const canSee = roleInList(role, TENDER_DEFINITION_ROLES);

    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<TenderNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const refresh = useCallback(async () => {
        if (!canSee) return;
        try {
            const [count, items] = await Promise.all([
                getTenderNotificationUnreadCount(),
                getTenderNotifications(),
            ]);
            setUnreadCount(count);
            setNotifications(items.slice(0, 8));
        } catch {
            /* ignore — user may not be authenticated yet */
        }
    }, [canSee]);

    useEffect(() => {
        void refresh();
        const interval = window.setInterval(() => void refresh(), 60_000);
        return () => window.clearInterval(interval);
    }, [refresh]);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        void getTenderNotifications()
            .then((items) => setNotifications(items.slice(0, 8)))
            .finally(() => setLoading(false));
    }, [open]);

    useEffect(() => {
        const onDocClick = (event: MouseEvent) => {
            if (!panelRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [open]);

    if (!canSee) return null;

    const openNotification = async (note: TenderNotification) => {
        if (!note.is_read) {
            await markTenderNotificationRead(note.id);
            setUnreadCount((c) => Math.max(0, c - 1));
        }
        setOpen(false);
        if (note.link) {
            navigate(note.link);
        }
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                type="button"
                className="relative inline-flex rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                onClick={() => setOpen((v) => !v)}
            >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                {unreadCount > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                ) : null}
            </button>

            {open ? (
                <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg sm:w-96">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">Notifications</p>
                        {unreadCount > 0 ? (
                            <button
                                type="button"
                                className="text-xs font-medium text-brand-700 hover:underline"
                                onClick={() =>
                                    void markAllTenderNotificationsRead().then(() => refresh())
                                }
                            >
                                Mark all read
                            </button>
                        ) : null}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <p className="px-4 py-6 text-sm text-slate-500">Loading…</p>
                        ) : notifications.length === 0 ? (
                            <p className="px-4 py-6 text-sm text-slate-500">No notifications yet.</p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {notifications.map((note) => (
                                    <li key={note.id}>
                                        <button
                                            type="button"
                                            className={cn(
                                                "w-full px-4 py-3 text-left hover:bg-slate-50",
                                                !note.is_read && "bg-sky-50/60",
                                            )}
                                            onClick={() => void openNotification(note)}
                                        >
                                            <p className="text-sm font-medium text-slate-900">{note.title}</p>
                                            <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">
                                                {note.message}
                                            </p>
                                            <p className="mt-1 text-[10px] text-slate-400">
                                                {formatWhen(note.created_at)}
                                            </p>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="border-t border-slate-100 px-4 py-2">
                        <Link
                            to="/tenders/definitions"
                            className="text-xs font-medium text-brand-700 hover:underline"
                            onClick={() => setOpen(false)}
                        >
                            Manage tender definitions →
                        </Link>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
