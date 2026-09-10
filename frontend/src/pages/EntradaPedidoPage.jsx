import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Trash2, X } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import NotificationToast from '../components/NotificationToast';
import { useAuth } from '../context/AuthContext';

const money = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });
export default function EntradaPedidoPage() {
    const { selectedSucursalId, sucursales } = useAuth();
    const [tab, setTab] = useState('new'); const [providers, setProviders] = useState([]); const [products, setProducts] = useState([]); const [items, setItems] = useState([]); const [entries, setEntries] = useState([]);
    const [query, setQuery] = useState(''); const [historyQuery, setHistoryQuery] = useState(''); const [note, setNote] = useState(null); const [saving, setSaving] = useState(false); const [pendingProduct, setPendingProduct] = useState(null); const [confirmEntry, setConfirmEntry] = useState(false);
    const [header, setHeader] = useState({ idProveedor: '', fecha: new Date().toISOString().slice(0, 10), metodoPago: 'credito', observaciones: '' });
    const branch = sucursales.find(item => String(item.idSucursal) === String(selectedSucursalId));
    const total = useMemo(() => items.reduce((sum, item) => sum + item.cantidad * item.costoUnitario, 0), [items]);
    const units = items.reduce((sum, item) => sum + item.cantidad, 0);
    const loadEntries = useCallback(async (term = '') => { if (!selectedSucursalId) return; const response = await axiosClient.get('/inventario/entradas', { params: { idSucursal: selectedSucursalId, query: term } }); setEntries(response.data.data ?? []); }, [selectedSucursalId]);

    useEffect(() => { axiosClient.get('/inventario/entrada/proveedores').then(response => setProviders(response.data.data ?? [])); }, []);
    useEffect(() => { setEntries([]); }, [selectedSucursalId]);
    useEffect(() => { setItems([]); setQuery(''); setProducts([]); }, [header.idProveedor]);
    useEffect(() => { if (!header.idProveedor) return undefined; const timer = window.setTimeout(async () => { const response = await axiosClient.get('/inventario/entrada/productos', { params: { idProveedor: header.idProveedor, query } }); setProducts(response.data.data ?? []); }, 300); return () => window.clearTimeout(timer); }, [query, header.idProveedor]);

    const add = product => { setItems(current => current.some(item => item.idProducto === product.idProducto) ? current : [...current, { ...product, cantidad: 1, costoUnitario: Number(product.precio) }]); setPendingProduct(null); };
    const update = (id, field, value) => setItems(current => current.map(item => item.idProducto === id ? { ...item, [field]: Number(value) } : item));
    const requestSave = async () => {
        if (!header.idProveedor || !items.length) { setNote({ type: 'warning', message: 'Selecciona proveedor y productos.' }); return; }
        if (header.metodoPago === 'efectivo') {
            try {
                const response = await axiosClient.get('/operaciones/caja', { params: { idSucursal: selectedSucursalId } });
                if (!response.data.data?.idSesion) { setNote({ type: 'warning', message: 'No hay una caja abierta en esta sucursal. No puedes registrar una salida en efectivo.' }); return; }
            } catch { setNote({ type: 'error', message: 'No fue posible verificar la caja.' }); return; }
        }
        setConfirmEntry(true);
    };
    const save = async () => {
        setConfirmEntry(false); setSaving(true);
        try {
            await axiosClient.post('/inventario/entradas', { ...header, idSucursal: Number(selectedSucursalId), idProveedor: Number(header.idProveedor), fecha: `${header.fecha}T12:00:00`, detalles: items.map(({ idProducto, cantidad, costoUnitario }) => ({ idProducto, cantidad, costoUnitario })) });
            setItems([]); setHeader(current => ({ ...current, observaciones: '' })); await loadEntries(); setNote({ type: 'success', message: 'Entrada registrada correctamente.' });
        } catch (error) { setNote({ type: 'error', message: error.response?.data?.message || 'No fue posible registrar la entrada.' }); }
        finally { setSaving(false); }
    };

    return <div className="mx-auto max-w-[1450px] space-y-5">
        <NotificationToast notification={note} onClose={() => setNote(null)} />
        <header className="border bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Entrada de pedido · {branch?.nombreSuc || branch?.nombre}</h1><div className="flex bg-slate-100 p-1"><Tab active={tab === 'new'} onClick={() => setTab('new')}>Nueva entrada</Tab><Tab active={tab === 'history'} onClick={() => setTab('history')}>Entradas registradas</Tab></div></div></header>
        {tab === 'new' ? <div className="grid gap-5 xl:grid-cols-[1fr_330px]">
            <section className="space-y-5"><div className="border bg-white p-5"><h2 className="font-bold">Datos del pedido</h2><div className="mt-4 grid gap-4 md:grid-cols-3"><Field label="Proveedor *"><select className="input" value={header.idProveedor} onChange={event => setHeader({ ...header, idProveedor: event.target.value })}><option value="">Selecciona proveedor</option>{providers.map(item => <option key={item.idProveedor} value={item.idProveedor}>{item.nombre}</option>)}</select></Field><Field label="Fecha *"><input type="date" className="input" value={header.fecha} onChange={event => setHeader({ ...header, fecha: event.target.value })} /></Field><Field label="Forma de pago *"><select className="input" value={header.metodoPago} onChange={event => setHeader({ ...header, metodoPago: event.target.value })}><option value="efectivo">Efectivo</option><option value="tarjeta">Tarjeta</option><option value="transferencia">Transferencia</option><option value="credito">Crédito</option></select></Field><div className="md:col-span-3"><Field label="Observaciones"><textarea className="input h-20 py-2" value={header.observaciones} onChange={event => setHeader({ ...header, observaciones: event.target.value })} /></Field></div></div></div>
                <div className="border bg-white"><div className="border-b p-5"><h2 className="font-bold">Productos del proveedor</h2><div className="relative mt-4"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input disabled={!header.idProveedor} className="input pl-10" value={query} onChange={event => setQuery(event.target.value)} placeholder={header.idProveedor ? 'Buscar producto' : 'Selecciona primero un proveedor'} /></div><div className="mt-3 flex flex-wrap gap-2">{products.map(product => <button key={product.idProducto} onClick={() => setPendingProduct(product)} className="rounded-md border px-3 py-2 text-sm hover:border-brand-teal">{product.nombre}</button>)}</div></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead className="bg-slate-100 text-left"><tr><th className="p-4">Producto</th><th>Cantidad</th><th>Costo</th><th className="text-right">Subtotal</th><th /></tr></thead><tbody className="divide-y">{items.map(item => <tr key={item.idProducto}><td className="p-4 font-semibold">{item.nombre}</td><td><input type="number" min="1" className="input w-24" value={item.cantidad} onChange={event => update(item.idProducto, 'cantidad', event.target.value)} /></td><td><input type="number" min="0" step=".01" className="input w-32" value={item.costoUnitario} onChange={event => update(item.idProducto, 'costoUnitario', event.target.value)} /></td><td className="text-right font-bold">{money.format(item.cantidad * item.costoUnitario)}</td><td className="p-3"><button onClick={() => setItems(items.filter(current => current.idProducto !== item.idProducto))} aria-label="Quitar producto"><Trash2 className="h-4 w-4 text-red-500" /></button></td></tr>)}{!items.length && <tr><td colSpan="5" className="py-12 text-center text-slate-500">Sin productos agregados</td></tr>}</tbody></table></div></div></section>
            <aside className="h-fit border bg-white p-5"><h2 className="font-bold">Total de la entrada</h2><p className="mt-4 flex justify-between text-sm"><span>Unidades</span><b>{units}</b></p><p className="mt-5 text-3xl font-bold">{money.format(total)}</p><button disabled={saving || !items.length} onClick={requestSave} className="mt-5 w-full rounded-md bg-brand-teal py-3 font-bold text-white disabled:opacity-50">{saving ? 'Registrando…' : 'Guardar entrada'}</button></aside>
        </div> : <section className="border bg-white"><div className="flex gap-2 border-b p-4"><input className="input" value={historyQuery} onChange={event => setHistoryQuery(event.target.value)} placeholder="Pedido o proveedor" /><button onClick={() => loadEntries(historyQuery)} className="rounded-md bg-brand-teal px-4 text-white">Buscar</button></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead className="bg-slate-100 text-left"><tr><th className="p-4">Pedido</th><th>Proveedor</th><th>Fecha</th><th>Pago</th><th className="p-4 text-right">Total</th></tr></thead><tbody className="divide-y">{entries.map(entry => <tr key={entry.idCompra}><td className="p-4 font-semibold">{entry.numeroPedido}</td><td>{entry.proveedorNombre}</td><td>{new Date(entry.fecha).toLocaleString('es-GT')}</td><td className="capitalize">{entry.metodoPago}</td><td className="p-4 text-right font-bold">{money.format(entry.total)}</td></tr>)}</tbody></table></div></section>}
        {pendingProduct && <ConfirmModal title="Agregar producto" text={`¿Deseas agregar “${pendingProduct.nombre}” al pedido?`} cancel={() => setPendingProduct(null)} accept={() => add(pendingProduct)} acceptText="Agregar" />}
        {confirmEntry && <ConfirmModal title="Guardar entrada" text={`Se registrarán ${units} unidades por ${money.format(total)}. ¿Los datos son correctos?`} cancel={() => setConfirmEntry(false)} accept={save} acceptText="Confirmar entrada" />}
    </div>;
}
function Field({ label, children }) { return <label className="block text-sm font-semibold"><span className="mb-1 block">{label}</span>{children}</label>; }
function Tab({ active, onClick, children }) { return <button onClick={onClick} className={`rounded-sm px-4 py-2 text-sm font-semibold ${active ? 'bg-white text-brand-teal shadow-sm' : 'text-slate-500'}`}>{children}</button>; }
function ConfirmModal({ title, text, cancel, accept, acceptText }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><div className="w-full max-w-md border bg-white p-5 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">{title}</h2><button onClick={cancel} aria-label="Cerrar"><X className="h-5 w-5" /></button></div><p className="mt-4 text-sm text-slate-600">{text}</p><div className="mt-6 flex justify-end gap-2"><button onClick={cancel} className="rounded-md border px-4 py-2">Cancelar</button><button onClick={accept} className="rounded-md bg-brand-teal px-4 py-2 font-bold text-white">{acceptText}</button></div></div></div>; }
