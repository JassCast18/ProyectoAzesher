import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Camera, CameraOff, ScanLine, X } from 'lucide-react';

export default function MobileCameraScannerModal({ open, onClose, onDetected }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const detectedRef = useRef(false);
  const closeRef = useRef(onClose);
  const detectedCallbackRef = useRef(onDetected);
  closeRef.current = onClose;
  detectedCallbackRef.current = onDetected;
  const [state, setState] = useState('idle');
  const [message, setMessage] = useState('Apunta la cámara al código del producto.');

  const stop = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  };

  useEffect(() => {
    if (!open) return undefined;
    detectedRef.current = false;
    const start = async () => {
      setState('starting');
      try {
        const reader = new BrowserMultiFormatReader();
        controlsRef.current = await reader.decodeFromConstraints(
          { audio: false, video: { facingMode: { ideal: 'environment' } } },
          videoRef.current,
          result => {
            if (!result || detectedRef.current) return;
            detectedRef.current = true;
            navigator.vibrate?.(100);
            stop();
            detectedCallbackRef.current?.(result.getText());
            closeRef.current?.();
          },
        );
        setState('running');
      } catch (error) {
        setState('error');
        setMessage(error?.name === 'NotAllowedError' ? 'Permite el acceso a la cámara para escanear.' : 'No fue posible abrir la cámara. Cierra esta ventana y escribe el código.');
      }
    };
    start();
    return stop;
  }, [open]);

  if (!open) return null;
  return <div className="fixed inset-0 z-[60] flex items-end bg-slate-950/80 sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true">
    <div className="w-full overflow-hidden rounded-t-2xl bg-slate-950 text-white shadow-2xl sm:max-w-lg sm:rounded-2xl">
      <header className="flex items-center justify-between p-4"><div><h2 className="font-bold">Escanear con la cámara</h2><p className="text-xs text-slate-300">La lectura se agregará directamente a la venta.</p></div><button type="button" onClick={onClose} className="rounded-full border border-slate-600 p-2" aria-label="Cerrar"><X className="h-5 w-5" /></button></header>
      <div className="relative aspect-[3/4] max-h-[65vh] bg-black"><video ref={videoRef} className="h-full w-full object-cover" muted playsInline /><div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="h-36 w-4/5 rounded-xl border-2 border-cyan-300 shadow-[0_0_0_9999px_rgba(2,6,23,0.45)]"><ScanLine className="mx-auto mt-14 h-7 w-7 text-cyan-300" /></div></div></div>
      <div className="flex items-center gap-3 p-4"><span className="rounded-lg bg-slate-800 p-2">{state === 'error' ? <CameraOff className="h-5 w-5 text-red-300" /> : <Camera className="h-5 w-5 text-cyan-300" />}</span><p className="text-sm">{state === 'starting' ? 'Abriendo cámara…' : message}</p></div>
    </div>
  </div>;
}
