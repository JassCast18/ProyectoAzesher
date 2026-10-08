import { useCallback, useEffect, useRef, useState } from 'react';
import { Barcode, Trash2, X } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function ProductBarcodeModal({ product, onClose, onChanged, onNotify }) {
  const [codes, setCodes] = useState([]);
  const [code, setCode] = useState('');
  const [type, setType] = useState('CODE128');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  const notifyRef = useRef(onNotify);
  notifyRef.current = onNotify;

  const loadCodes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get(`/inventario/productos/${product.idProducto}/codigos-barras`);
      setCodes(response.data?.data ?? []);
    } catch (error) {
      notifyRef.current?.('error', error.response?.data?.message || 'No fue posible cargar los códigos del producto.');
    } finally {
      setLoading(false);
    }
  }, [product.idProducto]);

  useEffect(() => {
    loadCodes();
    window.setTimeout(() => inputRef.current?.focus(), 100);
  }, [loadCodes]);

  const save = async event => {
    event?.preventDefault();
    const normalized = code.trim();
    if (!/^[A-Za-z0-9._-]{4,100}$/.test(normalized)) {
      notifyRef.current?.('warning', 'El código debe contener de 4 a 100 letras, números, puntos, guiones o guion bajo.');
      return;
    }
    setSaving(true);
    try {
      await axiosClient.post(`/inventario/productos/${product.idProducto}/codigos-barras`, { codigo: normalized, tipo: type });
      setCode('');
      await loadCodes();
      onChanged?.();
      notifyRef.current?.('success', 'Código de barras asignado correctamente.');
      inputRef.current?.focus();
    } catch (error) {
      notifyRef.current?.('error', error.response?.data?.message || 'No fue posible asignar el código.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async item => {
    try {
      await axiosClient.delete(`/inventario/productos/${product.idProducto}/codigos-barras/${item.idCodigoBarra}`);
      await loadCodes();
      onChanged?.();
      notifyRef.current?.('success', 'Código desactivado.');
    } catch (error) {
      notifyRef.current?.('error', error.response?.data?.message || 'No fue posible desactivar el código.');
    }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
    <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <header className="flex items-start justify-between border-b border-slate-200 p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--branch-color)]">Producto #{product.idProducto}</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Códigos de barras</h2>
          <p className="mt-1 text-sm text-slate-500">{product.nombre}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="Cerrar"><X className="h-4 w-4" /></button>
      </header>

      <form onSubmit={save} className="border-b border-slate-200 bg-slate-50 p-5">
        <label className="text-sm font-semibold text-slate-800" htmlFor="product-barcode">Escanea con el lector o escribe el código</label>
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_130px_auto]">
          <div className="relative">
            <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input ref={inputRef} id="product-barcode" value={code} onChange={event => setCode(event.target.value)} className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 font-mono text-sm outline-none focus:border-[var(--branch-color)]" placeholder="Escanear código" autoComplete="off" />
          </div>
          <select value={type} onChange={event => setType(event.target.value)} className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm">
            <option value="CODE128">Code 128</option><option value="EAN13">EAN-13</option><option value="EAN8">EAN-8</option><option value="UPC">UPC</option><option value="QR">QR</option>
          </select>
          <button disabled={saving} className="button-primary h-11 px-4 disabled:opacity-60">{saving ? 'Guardando…' : 'Asignar'}</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Los lectores USB y Bluetooth funcionan como teclado y enviarán el código al presionar Enter.</p>
      </form>

      <div className="max-h-72 overflow-auto p-5">
        {loading ? <p className="py-6 text-center text-sm text-slate-500">Cargando códigos…</p> : codes.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-sm text-slate-500">Este producto todavía no tiene códigos asignados.</p> : <div className="space-y-2">{codes.map(item => <div key={item.idCodigoBarra} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"><div><p className="font-mono font-semibold text-slate-900">{item.codigo}</p><p className="text-xs text-slate-500">{item.tipo}</p></div><button type="button" onClick={() => remove(item)} className="rounded-full border border-red-200 p-2 text-red-600 hover:bg-red-50" title="Desactivar código"><Trash2 className="h-4 w-4" /></button></div>)}</div>}
      </div>
    </div>
  </div>;
}
