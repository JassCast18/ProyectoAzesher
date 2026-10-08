import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Link2, LoaderCircle, Smartphone, X } from 'lucide-react';
import * as signalR from '@microsoft/signalr';
import QRCode from 'qrcode';
import axiosClient from '../api/axiosClient';

const apiRoot = String(axiosClient.defaults.baseURL || '/api').replace(/\/api\/?$/, '');

export default function PhoneScannerModal({ open, idSucursal, onClose, onProductScanned, onNotify }) {
  const [session, setSession] = useState(null);
  const [qr, setQr] = useState('');
  const [status, setStatus] = useState('Preparando lector…');
  const [copied, setCopied] = useState(false);
  const callbackRef = useRef(onProductScanned);
  const notifyRef = useRef(onNotify);
  callbackRef.current = onProductScanned;
  notifyRef.current = onNotify;

  useEffect(() => {
    if (!open || !idSucursal) return undefined;
    let disposed = false;
    let token = '';
    let connection;

    const start = async () => {
      try {
        const response = await axiosClient.post('/ventas/scanner/sessions', null, { params: { idSucursal } });
        if (disposed) return;
        const data = response.data?.data;
        token = data.token;
        const publicBase = String(import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');
        const link = `${publicBase}/lector/${token}`;
        const localOnly = ['localhost', '127.0.0.1', '::1'].includes(new URL(link).hostname);
        setSession({ ...data, link, localOnly });
        const qrData = await QRCode.toDataURL(link, { width: 260, margin: 1, errorCorrectionLevel: 'M' });
        if (disposed) return;
        setQr(qrData);

        connection = new signalR.HubConnectionBuilder()
          .withUrl(`${apiRoot}/hubs/sale-scanner`, { withCredentials: false })
          .withAutomaticReconnect()
          .build();
        connection.on('ProductScanned', product => callbackRef.current?.(product));
        connection.on('ScannerConnected', () => setStatus('Lector conectado y esperando códigos'));
        connection.onreconnecting(() => setStatus('Reconectando lector…'));
        connection.onreconnected(async () => { await connection.invoke('JoinSession', token); setStatus('Lector reconectado'); });
        await connection.start();
        await connection.invoke('JoinSession', token);
        setStatus('Escanea el QR o abre el enlace en el teléfono');
      } catch (error) {
        setStatus('No fue posible preparar el lector');
        notifyRef.current?.('error', error.response?.data?.message || error.message || 'No fue posible preparar el lector móvil.');
      }
    };
    start();

    return () => {
      disposed = true;
      if (connection) connection.stop();
      if (token) axiosClient.delete(`/ventas/scanner/sessions/${token}`).catch(() => {});
      setSession(null); setQr(''); setCopied(false);
    };
  }, [open, idSucursal]);

  if (!open) return null;

  const copyLink = async () => {
    if (!session?.link) return;
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(session.link);
    else {
      const field = document.createElement('textarea');
      field.value = session.link; document.body.appendChild(field); field.select();
      document.execCommand('copy'); field.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true">
    <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className="flex items-start justify-between border-b border-slate-200 p-5"><div className="flex gap-3"><span className="rounded-xl bg-teal-50 p-3 text-[var(--branch-color)]"><Smartphone className="h-6 w-6" /></span><div><h2 className="text-xl font-bold text-slate-900">Usar teléfono como lector</h2><p className="mt-1 text-sm text-slate-500">Esta conexión pertenece únicamente a la venta y sucursal actuales.</p></div></div><button type="button" onClick={onClose} className="rounded-full border p-2 text-slate-500"><X className="h-4 w-4" /></button></header>
      <div className="grid gap-6 p-5 md:grid-cols-[280px_1fr]">
        <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-3">{qr ? <img src={qr} alt="QR para abrir el lector móvil" className="h-[250px] w-[250px]" /> : <LoaderCircle className="h-8 w-8 animate-spin text-slate-400" />}</div>
        <div className="flex flex-col justify-center"><p className="text-sm font-semibold text-slate-900">1. Escanea el QR con la cámara del teléfono</p><p className="mt-2 text-sm text-slate-600">2. Autoriza el uso de la cámara</p><p className="mt-2 text-sm text-slate-600">3. Apunta al código del producto; se agregará en esta computadora</p>{session?.localOnly && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">El enlace actual usa localhost y solo abrirá en esta computadora. Para probar con el teléfono configura VITE_PUBLIC_APP_URL y VITE_API_BASE_URL con direcciones HTTPS accesibles.</p>}<div className="my-4 flex items-center gap-3"><span className="h-px flex-1 bg-slate-200" /><span className="text-xs font-semibold uppercase text-slate-400">o comparte el enlace</span><span className="h-px flex-1 bg-slate-200" /></div><button type="button" onClick={copyLink} disabled={!session} className="button-secondary justify-center"><span>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</span>{copied ? 'Enlace copiado' : 'Copiar enlace del lector'}</button>{session?.link && <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500"><Link2 className="mt-0.5 h-4 w-4 shrink-0" /><span className="break-all">{session.link}</span></div>}</div>
      </div>
      <footer className="flex items-center gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-600"><span className={`h-2.5 w-2.5 rounded-full ${session ? 'bg-emerald-500' : 'bg-amber-500'}`} />{status}</footer>
    </div>
  </div>;
}
