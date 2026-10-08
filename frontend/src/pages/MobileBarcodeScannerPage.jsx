import { useEffect, useRef, useState } from 'react';
import { Barcode, Camera, CameraOff, CheckCircle2, Keyboard, ScanLine } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';
import axiosClient from '../api/axiosClient';

export default function MobileBarcodeScannerPage() {
  const { token } = useParams();
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const lastReadRef = useRef({ code: '', at: 0 });
  const [sessionState, setSessionState] = useState('loading');
  const [cameraState, setCameraState] = useState('idle');
  const [manualCode, setManualCode] = useState('');
  const [message, setMessage] = useState('Abre la cámara y apunta al código del producto.');
  const [lastProduct, setLastProduct] = useState(null);

  useEffect(() => {
    axiosClient.get(`/ventas/scanner/sessions/${token}`)
      .then(() => setSessionState('ready'))
      .catch(error => { setSessionState('expired'); setMessage(error.response?.data?.message || 'Este enlace ya no está disponible.'); });
    return () => controlsRef.current?.stop();
  }, [token]);

  const sendCode = async rawCode => {
    const code = String(rawCode || '').trim();
    if (!code) return;
    const now = Date.now();
    if (lastReadRef.current.code === code && now - lastReadRef.current.at < 1200) return;
    lastReadRef.current = { code, at: now };
    try {
      const response = await axiosClient.post(`/ventas/scanner/sessions/${token}/scans`, { codigo: code });
      const product = response.data?.data;
      if (product) {
        setLastProduct(product);
        setMessage(`${product.nombre} enviado a la venta.`);
        navigator.vibrate?.(100);
      }
      setManualCode('');
    } catch (error) {
      setLastProduct(null);
      setMessage(error.response?.data?.message || 'No fue posible enviar el código.');
    }
  };

  const startCamera = async () => {
    setCameraState('starting');
    setMessage('Solicitando acceso a la cámara…');
    try {
      const reader = new BrowserMultiFormatReader();
      controlsRef.current = await reader.decodeFromConstraints(
        { audio: false, video: { facingMode: { ideal: 'environment' } } },
        videoRef.current,
        result => { if (result) sendCode(result.getText()); },
      );
      setCameraState('running');
      setMessage('Lector activo. Apunta al código del producto.');
    } catch (error) {
      setCameraState('error');
      setMessage(error?.message?.includes('Permission') ? 'Debes permitir el acceso a la cámara.' : 'No fue posible abrir la cámara. Puedes escribir el código manualmente.');
    }
  };

  const stopCamera = () => {
    controlsRef.current?.stop(); controlsRef.current = null;
    setCameraState('idle');
    setMessage('Cámara detenida.');
  };

  if (sessionState === 'loading') return <main className="grid min-h-screen place-items-center bg-slate-950 text-white">Validando lector…</main>;
  if (sessionState === 'expired') return <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-center text-white"><div><Barcode className="mx-auto h-12 w-12 text-red-400" /><h1 className="mt-4 text-2xl font-bold">Lector no disponible</h1><p className="mt-2 text-slate-300">{message}</p></div></main>;

  return <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
    <div className="mx-auto max-w-lg">
      <header className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Aze-Sher · lector móvil</p><h1 className="mt-2 text-2xl font-bold">Escanear producto</h1><p className="mt-1 text-sm text-slate-300">Los códigos se enviarán a la venta abierta en la computadora.</p></header>
      <section className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"><div className="relative aspect-[3/4] max-h-[58vh] bg-black"><video ref={videoRef} className="h-full w-full object-cover" muted playsInline /><div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="h-36 w-4/5 rounded-xl border-2 border-cyan-300 shadow-[0_0_0_9999px_rgba(2,6,23,0.45)]"><ScanLine className="mx-auto mt-14 h-7 w-7 text-cyan-300" /></div></div></div><div className="grid grid-cols-2 gap-3 p-4"><button onClick={startCamera} disabled={cameraState === 'running' || cameraState === 'starting'} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"><Camera className="h-5 w-5" />{cameraState === 'starting' ? 'Abriendo…' : 'Abrir cámara'}</button><button onClick={stopCamera} disabled={cameraState !== 'running'} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 px-4 py-3 font-semibold disabled:opacity-50"><CameraOff className="h-5 w-5" />Detener</button></div></section>
      <section className={`mt-4 rounded-xl border p-4 ${lastProduct ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-700 bg-slate-900'}`}>{lastProduct && <CheckCircle2 className="mb-2 h-6 w-6 text-emerald-400" />}<p className="text-sm">{message}</p>{lastProduct && <p className="mt-1 font-bold">{lastProduct.nombre}</p>}</section>
      <form onSubmit={event => { event.preventDefault(); sendCode(manualCode); }} className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-4"><label className="flex items-center gap-2 text-sm font-semibold"><Keyboard className="h-4 w-4" />Ingresar código manualmente</label><div className="mt-2 flex gap-2"><input value={manualCode} onChange={event => setManualCode(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-3 font-mono outline-none focus:border-cyan-400" inputMode="text" autoComplete="off" /><button className="rounded-lg bg-white px-4 font-semibold text-slate-950">Enviar</button></div></form>
    </div>
  </main>;
}
