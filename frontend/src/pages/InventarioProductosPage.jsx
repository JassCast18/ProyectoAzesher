import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Boxes, Clock3, Download, FileSpreadsheet, PackageCheck, PackageX, Search } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import NotificationToast from '../components/NotificationToast';
import { useAuth } from '../context/AuthContext';

const currency = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });
const dateTime = new Intl.DateTimeFormat('es-GT', { dateStyle: 'long', timeStyle: 'medium' });

export default function InventarioProductosPage() {
    const { selectedSucursalId, sucursales } = useAuth();
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState('');
    const [notification, setNotification] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [now, setNow] = useState(new Date());

    const branch = useMemo(() => sucursales.find(item => String(item.idSucursal) === String(selectedSucursalId)), [selectedSucursalId, sucursales]);
    const totals = useMemo(() => ({
        units: products.reduce((sum, product) => sum + product.stock, 0),
        low: products.filter(product => product.stock > 0 && product.stock <= 5).length,
        empty: products.filter(product => product.stock <= 0).length,
        value: products.reduce((sum, product) => sum + product.stock * product.precio, 0),
    }), [products]);

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    const loadInventory = useCallback(async (query = '') => {
        if (!selectedSucursalId) return;
        setLoading(true);
        try {
            const response = await axiosClient.get('/inventario/productos', { params: { idSucursal: selectedSucursalId, query } });
            setProducts(response.data.data ?? []);
            setLastUpdated(new Date());
        } catch (error) {
            setProducts([]);
            setNotification({ type: 'error', message: error.response?.data?.message || 'No fue posible cargar el inventario.' });
        } finally {
            setLoading(false);
        }
    }, [selectedSucursalId]);

    useEffect(() => {
        setSearch('');
        setAppliedSearch('');
        loadInventory('');
    }, [loadInventory]);

    const submitSearch = event => {
        event.preventDefault();
        const query = search.trim();
        setAppliedSearch(query);
        loadInventory(query);
    };

    const downloadReport = async format => {
        setExporting(format);
        try {
            const response = await axiosClient.get(`/inventario/reporte/${format}`, {
                params: { idSucursal: selectedSucursalId, query: appliedSearch }, responseType: 'blob',
            });
            const extension = format === 'pdf' ? 'pdf' : 'xlsx';
            const url = URL.createObjectURL(response.data);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `inventario_${branch?.nombreSuc || branch?.nombre || selectedSucursalId}_${new Date().toISOString().slice(0, 19).replaceAll(':', '-')}.${extension}`;
            anchor.click();
            URL.revokeObjectURL(url);
            setNotification({ type: 'success', message: `Reporte ${extension.toUpperCase()} generado correctamente.` });
        } catch (error) {
            setNotification({ type: 'error', message: error.response?.data?.message || 'No fue posible generar el reporte.' });
        } finally {
            setExporting('');
        }
    };

    return (
        <div className="mx-auto max-w-[1500px] space-y-5">
            <NotificationToast notification={notification} onClose={() => setNotification(null)} />

            <section className="border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-teal">Inventarios / Listado de productos</p>
                        <h1 className="text-2xl font-bold text-slate-900">Existencias de {branch?.nombreSuc || branch?.nombre || 'la sucursal'}</h1>
                        <p className="mt-2 max-w-2xl text-sm text-slate-500">Consulta existencias por código o nombre. Este listado es informativo; las entradas se registran en su propio submódulo.</p>
                    </div>
                    <div className="grid min-w-[290px] grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-l-4 border-brand-teal bg-slate-50 px-4 py-3 text-sm">
                        <Clock3 className="row-span-2 mt-1 h-5 w-5 text-brand-teal" />
                        <span className="font-semibold text-slate-800">{dateTime.format(now)}</span>
                        <span className="text-xs text-slate-500">Última consulta: {lastUpdated ? dateTime.format(lastUpdated) : 'Pendiente'}</span>
                    </div>
                </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric icon={Boxes} label="Productos listados" value={products.length} detail={`${totals.units} unidades`} />
                <Metric icon={PackageCheck} label="Valor en inventario" value={currency.format(totals.value)} detail="Según precio registrado" />
                <Metric icon={AlertTriangle} label="Existencia baja" value={totals.low} detail="Entre 1 y 5 unidades" tone="amber" />
                <Metric icon={PackageX} label="Sin existencias" value={totals.empty} detail="Productos con stock cero" tone="red" />
            </section>

            <section className="border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <form onSubmit={submitSearch} className="flex w-full max-w-2xl gap-2">
                        <label className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input value={search} onChange={event => setSearch(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-teal-100" placeholder="Código, nombre o descripción del producto" />
                        </label>
                        <button className="rounded-lg bg-brand-teal px-5 text-sm font-semibold text-white hover:bg-teal-700" type="submit">Verificar</button>
                    </form>
                    <div className="flex gap-2">
                        <button disabled={loading || exporting !== ''} onClick={() => downloadReport('pdf')} className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-teal hover:text-brand-teal disabled:opacity-50"><Download className="h-4 w-4" />{exporting === 'pdf' ? 'Generando…' : 'PDF'}</button>
                        <button disabled={loading || exporting !== ''} onClick={() => downloadReport('excel')} className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-700 disabled:opacity-50"><FileSpreadsheet className="h-4 w-4" />{exporting === 'excel' ? 'Generando…' : 'Excel'}</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-sm">
                        <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-5 py-3">Código</th><th className="px-5 py-3">Producto</th><th className="px-5 py-3">Descripción</th><th className="px-5 py-3 text-right">Precio</th><th className="px-5 py-3 text-center">Existencia</th><th className="px-5 py-3 text-right">Valor</th><th className="px-5 py-3">Estado</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? <tr><td colSpan="7" className="px-5 py-16 text-center text-slate-500">Consultando inventario…</td></tr> : products.length === 0 ? <tr><td colSpan="7" className="px-5 py-16 text-center"><PackageX className="mx-auto mb-3 h-8 w-8 text-slate-300" /><p className="font-semibold text-slate-700">No se encontró existencia para esta búsqueda</p><p className="mt-1 text-xs text-slate-500">Verifica el código o consulta el listado completo.</p></td></tr> : products.map(product => <tr key={product.idInventario} className="hover:bg-slate-50"><td className="px-5 py-4 font-mono text-xs text-slate-500">#{product.idProducto}</td><td className="px-5 py-4 font-semibold text-slate-900">{product.nombre}</td><td className="max-w-xs truncate px-5 py-4 text-slate-500" title={product.descripcion}>{product.descripcion || '—'}</td><td className="px-5 py-4 text-right">{currency.format(product.precio)}</td><td className="px-5 py-4 text-center text-base font-bold text-slate-800">{product.stock}</td><td className="px-5 py-4 text-right font-medium">{currency.format(product.stock * product.precio)}</td><td className="px-5 py-4"><StockBadge stock={product.stock} /></td></tr>)}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500"><span>{appliedSearch ? `Resultado para “${appliedSearch}”` : 'Listado completo de la sucursal'}</span><span>{products.length} registros</span></div>
            </section>
        </div>
    );
}

function Metric({ icon: Icon, label, value, detail, tone = 'teal' }) {
    const tones = { teal: 'bg-teal-50 text-brand-teal', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700' };
    return <div className="border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div><span className={`rounded-lg p-2 ${tones[tone]}`}><Icon className="h-5 w-5" /></span></div></div>;
}

function StockBadge({ stock }) {
    if (stock <= 0) return <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">Sin existencias</span>;
    if (stock <= 5) return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Existencia baja</span>;
    return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Disponible</span>;
}
