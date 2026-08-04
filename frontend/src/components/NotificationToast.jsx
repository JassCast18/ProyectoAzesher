import { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, CircleAlert, Info, X } from 'lucide-react';

const styles = {
    error: { icon: CircleAlert, className: 'border-red-200 bg-red-50 text-red-900' },
    warning: { icon: AlertTriangle, className: 'border-amber-200 bg-amber-50 text-amber-900' },
    success: { icon: CheckCircle2, className: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
    info: { icon: Info, className: 'border-sky-200 bg-sky-50 text-sky-900' },
};

export default function NotificationToast({ notification, onClose }) {
    const type = notification?.type ?? 'warning';
    const isPersistent = type === 'error';

    useEffect(() => {
        if (!notification || isPersistent) return undefined;
        const timeoutId = window.setTimeout(onClose, 10000);
        return () => window.clearTimeout(timeoutId);
    }, [notification, isPersistent, onClose]);

    if (!notification) return null;

    const style = styles[type] ?? styles.warning;
    const Icon = style.icon;

    return (
        <div className="fixed right-4 top-20 z-50 w-[min(24rem,calc(100vw-2rem))]" role={type === 'error' ? 'alert' : 'status'}>
            <div className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg ${style.className}`}>
                <Icon className="mt-0.5 h-5 w-5 flex-none" />
                <p className="flex-1 text-sm font-medium leading-5">{notification.message}</p>
                <button type="button" onClick={onClose} className="rounded p-1 hover:bg-black/5" aria-label="Cerrar notificación">
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
