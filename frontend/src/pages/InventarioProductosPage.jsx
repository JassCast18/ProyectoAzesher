import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileSpreadsheet, PackageX, Search } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import NotificationToast from '../components/NotificationToast';
import { useAuth } from '../context/AuthContext';

const currency = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });
const dateTime = new Intl.DateTimeFormat('es-GT', { dateStyle: 'short', timeStyle: 'short' });

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

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const query = search.trim();
            setAppliedSearch(query);
            loadInventory(query);
        }, 350);
        return () => window.clearTimeout(timer);
    }, [search, loadInventory]);

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

            <section className="page-title p-5 sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Inventario · {branch?.nombreSuc || branch?.nombre || 'Sucursal'}</h1>
                    </div>
                    <div className="min-w-[260px] border-l-4 border-[var(--branch-color)] bg-white/60 px-4 py-3 text-sm">
                        <span className="font-semibold text-slate-800">{dateTime.format(now)}</span>
                        <span className="mt-1 block text-xs text-slate-500">Actualizado: {lastUpdated ? dateTime.format(lastUpdated) : 'Pendiente'}</span>
                    </div>
                </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Productos" value={products.length} detail={`${totals.units} unidades`} />
                <Metric label="Valor registrado" value={currency.format(totals.value)} detail="Según precio actual" />
                <Metric label="Existencia baja" value={totals.low} detail="Entre 1 y 5 unidades" />
                <Metric label="Sin existencias" value={totals.empty} detail="Productos con stock cero" />
            </section>

            <section className="border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex w-full max-w-2xl gap-2">
                        <label className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input value={search} onChange={event => setSearch(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-teal-100" placeholder="Código, nombre o descripción del producto" />
                        </label>
                    </div>
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

function Metric({ label, value, detail }) {
    return <div className="border border-slate-200 bg-white p-4"><p className="text-sm font-semibold text-slate-600">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;
}

function StockBadge({ stock }) {
    if (stock <= 0) return <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">Sin existencias</span>;
    if (stock <= 5) return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Existencia baja</span>;
    return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Disponible</span>;
}
