import { useEffect, useMemo, useState } from 'react';
import { Clock3, LogOut, RefreshCw } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

export default function SessionExpiryGuard({ onLogout }) {
  const { user, updateToken } = useAuth();
  const expiresAt = useMemo(() => Number(user?.exp || 0) * 1000, [user?.exp]);
  const [remaining, setRemaining] = useState(() => Math.max(0, expiresAt - Date.now()));
  const [renewing, setRenewing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const check = () => {
      const next = Math.max(0, expiresAt - Date.now());
      setRemaining(next);
      if (expiresAt && next === 0) onLogout();
    };
    check();
    const interval = window.setInterval(check, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt, onLogout]);

  if (!expiresAt || remaining > 60_000) return null;

  const renew = async () => {
    setRenewing(true);
    setError('');
    try {
      const response = await axiosClient.post('/auth/refresh');
      const token = response.data?.data?.token;
      if (!token || !updateToken(token)) throw new Error('Token inválido');
    } catch {
      setError('No fue posible renovar ahora. Puedes intentarlo nuevamente antes de que termine el tiempo.');
    } finally {
      setRenewing(false);
    }
  };

  return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="session-title">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex items-start gap-3"><span className="rounded-xl bg-amber-50 p-3 text-amber-600"><Clock3 className="h-6 w-6" /></span><div><h2 id="session-title" className="text-lg font-bold text-slate-900">Tu sesión está por vencer</h2><p className="mt-1 text-sm text-slate-600">Se cerrará en <strong>{Math.max(1, Math.ceil(remaining / 1000))} segundos</strong>. Continúa para conservar tu trabajo.</p></div></div>
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 grid gap-2 sm:grid-cols-2"><button type="button" onClick={onLogout} className="button-secondary justify-center text-red-600"><LogOut className="h-4 w-4" />Cerrar sesión</button><button type="button" onClick={renew} disabled={renewing || remaining <= 0} className="button-primary justify-center disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${renewing ? 'animate-spin' : ''}`} />{renewing ? 'Renovando…' : 'Continuar sesión'}</button></div>
    </div>
  </div>;
}
