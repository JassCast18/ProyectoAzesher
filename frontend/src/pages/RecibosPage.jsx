import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, FilePlus2, FileText, Search, Table2, Trash2, Printer } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import NotificationToast from '../components/NotificationToast';
import ConfirmCancelModal from '../components/ConfirmCancelModal';

const money = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });

export default function RecibosPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { selectedSucursalId } = useAuth();
    const [filters, setFilters] = useState({ query: searchParams.get('recibo') || searchParams.get('cliente') || '', fechaDesde: '', fechaHasta: '', tipoDocumento: searchParams.get('tipo') === 'nota' ? 'nota' : 'recibo', metodoPago: '' });
    const filtersRef = useRef(filters);
    const [receipts, setReceipts] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [notification, setNotification] = useState(null);
    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => { filtersRef.current = filters; }, [filters]);
    useEffect(() => { setReceipts([]); setSelectedIds([]); }, [selectedSucursalId]);
    const selected = useMemo(() => receipts.filter(receipt => selectedIds.includes(receipt.idRecibo)), [receipts, selectedIds]);
    const single = selected.length === 1 ? selected[0] : null;

    const loadReceipts = useCallback(async () => {
        if (!selectedSucursalId) return;
        setLoading(true);
        try {
            const current = filtersRef.current;
            const response = await axiosClient.get('/ventas/recibos', { params: { idSucursal: selectedSucursalId, query: current.query, fechaDesde: current.fechaDesde || null, fechaHasta: current.fechaHasta || null, tipoDocumento: current.tipoDocumento, metodoPago: current.metodoPago } });
            setReceipts(response.data?.data ?? []); setSelectedIds([]);
        } catch (error) { setNotification({ message: error.response?.data?.message || 'No fue posible cargar los documentos.', type: 'error' }); }
        finally { setLoading(false); }
    }, [selectedSucursalId]);
    const selectDocumentType = tipoDocumento => {
        const next = { ...filters, tipoDocumento, metodoPago: tipoDocumento === 'nota' ? 'credito' : '' };
        setFilters(next); filtersRef.current = next; setReceipts([]); setSelectedIds([]);
    };
    const toggle = id => setSelectedIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
    const toggleAll = () => setSelectedIds(selectedIds.length === receipts.length ? [] : receipts.map(receipt => receipt.idRecibo));

    const exportSelected = async format => {
        if (!selected.length) return;
        setExporting(true);
        const pdfWindows = format === 'pdf' ? selected.map(() => window.open('', '_blank')) : [];
        try {
            const files = await Promise.all(selected.map(receipt => axiosClient.get(`/ventas/recibos/${receipt.idRecibo}/${format}`, { responseType: 'blob' })));
            files.forEach((response, index) => {
                const url = URL.createObjectURL(response.data);
                if (format === 'pdf') {
                    if (pdfWindows[index]) pdfWindows[index].location.href = url;
                } else {
                    const anchor = document.createElement('a'); anchor.href = url;
                    anchor.download = format === 'docx' ? `${selected[index].numeroRecibo}.docx` : `detalle-${selected[index].numeroRecibo}.xlsx`;
                    anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1500);
                }
            });
        } catch {
            pdfWindows.forEach(page => page?.close());
            setNotification({ message: 'No fue posible generar todos los documentos seleccionados.', type: 'error' });
        } finally { setExporting(false); }
    };
    const viewInvoice = async receipt => {
        try { const response = await axiosClient.get(`/facturacion/${receipt.idFactura}/pdf`, { responseType: 'blob' }); window.open(URL.createObjectURL(response.data), '_blank', 'noopener,noreferrer'); }
        catch { setNotification({ message: 'No fue posible abrir la factura.', type: 'error' }); }
    };
    const cancelReceipt = async () => {
        setCancelling(true);
        try {
            await axiosClient.post(`/ventas/recibos/${cancelTarget.idRecibo}/anular`, { idSucursal: Number(selectedSucursalId), motivo: cancelReason.trim() });
            setCancelTarget(null); setCancelReason(''); setNotification({ message: 'Documento anulado y productos devueltos al inventario.', type: 'success' }); await loadReceipts();
        } catch (error) { setNotification({ message: error.response?.data?.message || 'No fue posible anular el documento.', type: 'error' }); }
        finally { setCancelling(false); }
    };

    const isNote = filters.tipoDocumento === 'nota';
    return <div className="space-y-5">
        <header className="page-title p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><h1 className="text-xl font-semibold text-slate-900">{isNote ? 'Notas de crédito' : 'Recibos'}</h1><span className="text-sm text-slate-500">{receipts.length} resultados</span></div></header>
        <section className="border bg-white">
            <div className="flex border-b"><button onClick={() => selectDocumentType('recibo')} className={`px-5 py-3 text-sm font-semibold ${!isNote ? 'border-b-2 border-brand-teal text-brand-teal' : 'text-slate-500'}`}>Recibos</button><button onClick={() => selectDocumentType('nota')} className={`px-5 py-3 text-sm font-semibold ${isNote ? 'border-b-2 border-brand-teal text-brand-teal' : 'text-slate-500'}`}>Notas de crédito</button></div>
            <div className="grid gap-3 p-5 lg:grid-cols-[1fr_160px_160px_170px_auto]"><input value={filters.query} onChange={event => setFilters({ ...filters, query: event.target.value })} placeholder="Cliente, NIT o número" className="input" /><input type="date" value={filters.fechaDesde} onChange={event => setFilters({ ...filters, fechaDesde: event.target.value })} className="input" /><input type="date" value={filters.fechaHasta} onChange={event => setFilters({ ...filters, fechaHasta: event.target.value })} className="input" /><select disabled={isNote} value={filters.metodoPago} onChange={event => setFilters({ ...filters, metodoPago: event.target.value })} className="input"><option value="">Todos los pagos</option><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="cheque">Cheque</option><option value="tarjeta">Tarjeta</option></select><button type="button" onClick={loadReceipts} className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-teal px-4 py-2.5 text-sm font-semibold text-white"><Search className="h-4 w-4" />Buscar</button></div>
        </section>
        <section className="border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="w-12 p-4"><input type="checkbox" checked={receipts.length > 0 && selectedIds.length === receipts.length} onChange={toggleAll} aria-label="Seleccionar todos" /></th><th className="p-4">Número</th><th className="p-4">Fecha</th><th className="p-4">Cliente</th><th className="p-4">Pago</th><th className="p-4 text-right">Monto</th><th className="p-4">Estado</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan="7" className="p-8 text-center text-slate-500">Buscando…</td></tr> : receipts.length === 0 ? <tr><td colSpan="7" className="p-8 text-center text-slate-500">Define los filtros y presiona Buscar.</td></tr> : receipts.map(receipt => { const active = selectedIds.includes(receipt.idRecibo); return <tr key={receipt.idRecibo} onClick={() => toggle(receipt.idRecibo)} className={`cursor-pointer ${active ? 'bg-teal-50' : 'hover:bg-slate-50'} ${receipt.estado === 'Anulado' ? 'text-slate-500' : ''}`}><td className="p-4"><input type="checkbox" checked={active} onChange={() => toggle(receipt.idRecibo)} onClick={event => event.stopPropagation()} aria-label={`Seleccionar ${receipt.numeroRecibo}`} /></td><td className="p-4"><span className="font-semibold text-slate-900">{receipt.numeroRecibo}</span>{receipt.esFacturada && <small className="block text-slate-500">{receipt.numeroFactura}</small>}</td><td className="p-4">{new Date(receipt.fechaPago).toLocaleString('es-GT')}</td><td className="p-4"><span className="font-medium">{receipt.clienteNombre}</span><small className="block">{receipt.clienteNit || 'CF'}</small></td><td className="p-4 capitalize">{receipt.metodoPago}</td><td className="p-4 text-right font-semibold">{money.format(receipt.monto)}</td><td className="p-4">{receipt.estado}</td></tr>; })}</tbody>
            </table></div>
            <footer className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-t bg-slate-50 px-4 py-3">
                <span className="text-sm font-medium text-slate-600">{selected.length ? `${selected.length} seleccionado${selected.length === 1 ? '' : 's'}` : 'Selecciona una o varias filas'}</span>
                <div className="flex flex-wrap justify-end gap-2"><Action icon={Printer} label="Imprimir PDF" disabled={!selected.length || exporting} onClick={() => exportSelected('pdf')} /><Action icon={FileText} label="Word" disabled={!selected.length || exporting} onClick={() => exportSelected('docx')} /><Action icon={Table2} label="Excel" disabled={!selected.length || exporting} onClick={() => exportSelected('excel')} />{single && !isNote && single.estado !== 'Anulado' && (single.esFacturada ? <Action icon={Eye} label="Ver factura" onClick={() => viewInvoice(single)} primary /> : <Action icon={FilePlus2} label="Generar factura" onClick={() => navigate(`/ventas/facturas/crear?recibo=${encodeURIComponent(single.numeroRecibo)}`)} primary />)}{single && single.estado !== 'Anulado' && !single.esFacturada && <Action icon={Trash2} label="Anular" danger onClick={() => { setCancelTarget(single); setCancelReason(''); }} />}</div>
            </footer>
        </section>
        <NotificationToast notification={notification} onClose={() => setNotification(null)} />
        <ConfirmCancelModal receipt={cancelTarget} reason={cancelReason} onReasonChange={setCancelReason} onCancel={() => setCancelTarget(null)} onConfirm={cancelReceipt} loading={cancelling} />
    </div>;
}

function Action({ icon: Icon, label, primary, danger, ...props }) {
    return <button type="button" {...props} className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${primary ? 'border-brand-teal bg-brand-teal text-white' : danger ? 'border-red-200 bg-white text-red-600' : 'border-slate-300 bg-white text-slate-700'}`}><Icon className="h-4 w-4" />{label}</button>;
}
