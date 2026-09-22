import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import NotificationToast from '../components/NotificationToast';

const money = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });

export default function CrearFacturaPage() {
    const { selectedSucursalId } = useAuth();
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [query, setQuery] = useState(params.get('recibo') || '');
    const [rows, setRows] = useState([]);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ nombre: '', nit: 'CF', direccion: '' });
    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(false);
    const autoSearched = useRef(false);
    const routeReceipt = params.get('recibo') || '';

    const search = async (term = query, selectExact = false) => {
        if (!selectedSucursalId) return;
        setLoading(true); setSelected(null);
        try {
            const response = await axiosClient.get('/facturacion/recibos', { params: { idSucursal: selectedSucursalId, query: term.trim() } });
            const results = response.data.data || [];
            setRows(results);
            if (selectExact) {
                const match = results.find(row => String(row.numeroRecibo).toLowerCase() === String(term).toLowerCase()) || (results.length === 1 ? results[0] : null);
                if (match && (match.puedeFacturar ?? ['Pendiente', 'Emitida'].includes(match.estadoFactura))) choose(match);
            }
        } catch (error) { setNotification({ type: 'error', message: error.response?.data?.message || 'No fue posible buscar el recibo.' }); }
        finally { setLoading(false); }
    };
    const canInvoice = row => row.puedeFacturar ?? ['Pendiente', 'Emitida'].includes(row.estadoFactura);
    const choose = row => {
        if (!canInvoice(row)) return;
        setSelected(row);
        setForm({ nombre: row.clienteNombre, nit: row.clienteNit || 'CF', direccion: row.clienteDireccion || '' });
    };
    useEffect(() => {
        if (!selectedSucursalId || !routeReceipt || autoSearched.current) return;
        autoSearched.current = true;
        setLoading(true);
        axiosClient.get('/facturacion/recibos', { params: { idSucursal: selectedSucursalId, query: routeReceipt.trim() } })
            .then(response => {
                const results = response.data.data || [];
                setRows(results);
                const match = results.find(row => String(row.numeroRecibo).toLowerCase() === routeReceipt.toLowerCase()) || (results.length === 1 ? results[0] : null);
                if (match && (match.puedeFacturar ?? ['Pendiente', 'Emitida'].includes(match.estadoFactura))) {
                    setSelected(match);
                    setForm({ nombre: match.clienteNombre, nit: match.clienteNit || 'CF', direccion: match.clienteDireccion || '' });
                }
            })
            .catch(error => setNotification({ type: 'error', message: error.response?.data?.message || 'No fue posible buscar el recibo.' }))
            .finally(() => setLoading(false));
    }, [selectedSucursalId, routeReceipt]);
    const save = async () => {
        const previewWindow = window.open('', '_blank');
        try {
            const response = await axiosClient.post('/facturacion', { idRecibo: selected.idRecibo, idSucursal: Number(selectedSucursalId), ...form });
            const idFactura = response.data.data.idFactura;
            const pdfResponse = await axiosClient.get(`/facturacion/${idFactura}/pdf`, { responseType: 'blob' });
            const url = URL.createObjectURL(pdfResponse.data);
            if (previewWindow) previewWindow.location.href = url;
            setNotification({ type: 'success', message: 'Factura autorizada.' });
            navigate(`/ventas/facturas?factura=${idFactura}`);
        } catch (error) {
            previewWindow?.close();
            setNotification({ type: 'error', message: error.response?.data?.errors || error.response?.data?.message || 'No fue posible facturar.' });
        }
    };

    return <div className="space-y-5">
        <NotificationToast notification={notification} onClose={() => setNotification(null)} />
        <header className="page-title p-5"><h1 className="text-2xl font-bold">Crear factura</h1></header>
        <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
            <section className="border bg-white">
                <div className="flex gap-2 border-b p-5"><input className="input" value={query} onChange={event => setQuery(event.target.value)} placeholder="Recibo, cliente o NIT" /><button onClick={() => { setQuery(''); setRows([]); setSelected(null); }} className="button-secondary">Limpiar</button><button onClick={() => search()} className="button-primary" aria-label="Buscar"><Search className="h-4 w-4" />Buscar</button></div>
                <div className="divide-y">{loading ? <p className="p-6 text-center text-sm text-slate-500">Buscando…</p> : rows.map(row => { const available = canInvoice(row); return <button key={row.idRecibo} disabled={!available} onClick={() => choose(row)} className={`flex w-full justify-between gap-4 p-4 text-left ${available ? 'hover:bg-teal-50' : 'cursor-not-allowed bg-slate-50 opacity-70'} ${selected?.idRecibo === row.idRecibo ? 'border-l-4 border-brand-teal bg-teal-50' : ''}`}><span><b>{row.numeroRecibo}</b><small className="block text-slate-500">{row.clienteNombre} · {row.clienteNit || 'CF'}</small>{!available && row.motivoNoFacturable && <small className="mt-1 block font-medium text-amber-700">{row.motivoNoFacturable}</small>}</span><b>{money.format(row.monto)}</b></button>; })}</div>
                {!loading && rows.length === 0 && <p className="p-8 text-center text-sm text-slate-500">Escribe un dato y presiona buscar.</p>}
            </section>
            <aside className="h-fit border bg-white p-5"><h2 className="font-bold">Datos fiscales</h2>{selected ? <div className="mt-4 space-y-4"><label className="block text-sm font-semibold">Nombre receptor *<input className="input mt-1" value={form.nombre} onChange={event => setForm({ ...form, nombre: event.target.value })} /></label><label className="block text-sm font-semibold">NIT<input className="input mt-1" value={form.nit} onChange={event => setForm({ ...form, nit: event.target.value })} /></label><label className="block text-sm font-semibold">Dirección<textarea className="input mt-1 h-24 py-2" value={form.direccion} onChange={event => setForm({ ...form, direccion: event.target.value })} /></label><button onClick={save} className="w-full rounded-md bg-brand-teal py-3 font-bold text-white">Autorizar factura</button></div> : <p className="mt-5 text-sm text-slate-500">Selecciona un recibo disponible.</p>}</aside>
        </div>
    </div>;
}
