import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Printer, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

const firstDay = () => { const date = new Date(); return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10); };
const today = () => new Date().toISOString().slice(0, 10);
const money = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });

export default function FacturasPage() {
    const { selectedSucursalId } = useAuth();
    const navigate = useNavigate();
    const [filters, setFilters] = useState({ query: '', fechaDesde: firstDay(), fechaHasta: today() });
    const [rows, setRows] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [printing, setPrinting] = useState(false);
    const selected = useMemo(() => rows.filter(row => selectedIds.includes(row.idFactura)), [rows, selectedIds]);
    const total = useMemo(() => rows.reduce((sum, row) => sum + row.total, 0), [rows]);

    useEffect(() => { setRows([]); setSelectedIds([]); }, [selectedSucursalId]);
    const load = async () => {
        if (!selectedSucursalId) return;
        setLoading(true);
        try {
            const response = await axiosClient.get('/facturacion', { params: { idSucursal: selectedSucursalId, ...filters } });
            setRows(response.data.data || []); setSelectedIds([]);
        } finally { setLoading(false); }
    };
    const toggle = id => setSelectedIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
    const toggleAll = () => setSelectedIds(selectedIds.length === rows.length ? [] : rows.map(row => row.idFactura));
    const printSelected = async () => {
        if (!selected.length) return;
        setPrinting(true);
        const pages = selected.map(() => window.open('', '_blank'));
        try {
            const responses = await Promise.all(selected.map(row => axiosClient.get(`/facturacion/${row.idFactura}/pdf`, { responseType: 'blob' })));
            responses.forEach((response, index) => { if (pages[index]) pages[index].location.href = URL.createObjectURL(response.data); });
        } catch { pages.forEach(page => page?.close()); }
        finally { setPrinting(false); }
    };

    return <div className="space-y-5">
        <header className="page-title p-5">
            <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Facturas</h1><p className="text-2xl font-bold text-brand-teal">{money.format(total)}</p></div>
            <div className="mt-4 grid gap-2 md:grid-cols-[1fr_170px_170px_auto]"><input className="input" value={filters.query} onChange={event => setFilters({ ...filters, query: event.target.value })} placeholder="Factura, recibo, NIT o receptor" /><input type="date" className="input" value={filters.fechaDesde} onChange={event => setFilters({ ...filters, fechaDesde: event.target.value })} /><input type="date" className="input" value={filters.fechaHasta} onChange={event => setFilters({ ...filters, fechaHasta: event.target.value })} /><button onClick={load} disabled={loading} className="flex items-center justify-center gap-2 rounded-md bg-brand-teal px-4 text-white disabled:opacity-50"><Search className="h-4 w-4" />{loading ? 'Buscando…' : 'Buscar'}</button></div>
        </header>
        <section className="border bg-white">
            <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-sm"><thead className="bg-slate-100 text-left"><tr><th className="w-12 p-4"><input type="checkbox" checked={rows.length > 0 && selectedIds.length === rows.length} onChange={toggleAll} aria-label="Seleccionar todas" /></th><th>Factura</th><th>Fecha</th><th>Receptor</th><th>Recibo</th><th className="p-4 text-right">Total</th></tr></thead>
                <tbody className="divide-y">{loading ? <tr><td colSpan="6" className="p-8 text-center text-slate-500">Buscando…</td></tr> : rows.length === 0 ? <tr><td colSpan="6" className="p-8 text-center text-slate-500">Define los filtros y presiona Buscar.</td></tr> : rows.map(row => { const active = selectedIds.includes(row.idFactura); return <tr key={row.idFactura} onClick={() => toggle(row.idFactura)} className={`cursor-pointer ${active ? 'bg-teal-50' : 'hover:bg-slate-50'}`}><td className="p-4"><input type="checkbox" checked={active} onChange={() => toggle(row.idFactura)} onClick={event => event.stopPropagation()} aria-label={`Seleccionar ${row.numeroFactura}`} /></td><td><b>{row.numeroFactura}</b><small className="block text-slate-500">{row.numeroAutorizacion}</small></td><td>{new Date(row.fechaEmision).toLocaleString('es-GT')}</td><td>{row.nombreReceptor}<small className="block">{row.nitReceptor}</small></td><td>{row.numeroRecibo}</td><td className="p-4 text-right font-bold">{money.format(row.total)}</td></tr>; })}</tbody>
            </table></div>
            <footer className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-t bg-slate-50 px-4 py-3"><span className="text-sm font-medium text-slate-600">{selected.length ? `${selected.length} seleccionada${selected.length === 1 ? '' : 's'}` : 'Selecciona una o varias facturas'}</span><div className="flex gap-2"><button onClick={printSelected} disabled={!selected.length || printing} className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"><Printer className="h-4 w-4" />Imprimir PDF</button><button onClick={() => navigate(`/ventas/recibos?recibo=${encodeURIComponent(selected[0].numeroRecibo)}`)} disabled={selected.length !== 1} className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"><ExternalLink className="h-4 w-4" />Ver recibo</button></div></footer>
        </section>
    </div>;
}
