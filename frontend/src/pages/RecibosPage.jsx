import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Search, Table2, Trash2, Printer } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import NotificationToast from '../components/NotificationToast';
import ConfirmCancelModal from '../components/ConfirmCancelModal';

const money = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });

export default function RecibosPage() {
    const { selectedSucursalId } = useAuth();
    const [filters, setFilters] = useState({ query: '', fechaDesde: '', fechaHasta: '' });
    const filtersRef = useRef(filters);
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => { filtersRef.current = filters; }, [filters]);

    const loadReceipts = useCallback(async () => {
        if (!selectedSucursalId) return;
        setLoading(true);
        try {
            const currentFilters = filtersRef.current;
            const response = await axiosClient.get('/ventas/recibos', { params: { idSucursal: selectedSucursalId, query: currentFilters.query, fechaDesde: currentFilters.fechaDesde || null, fechaHasta: currentFilters.fechaHasta || null } });
            setReceipts(response.data?.data ?? []);
        } catch (error) {
            setNotification({ message: error.response?.data?.message || 'No fue posible cargar los recibos.', type: 'error' });
        } finally { setLoading(false); }
    }, [selectedSucursalId]);

    useEffect(() => { loadReceipts(); }, [loadReceipts]);

    const download = async (receipt, format) => {
        try {
            const response = await axiosClient.get(`/ventas/recibos/${receipt.idRecibo}/${format}`, { responseType: 'blob' });
            const url = URL.createObjectURL(response.data);
            if (format === 'pdf') window.open(url, '_blank', 'noopener,noreferrer');
            else {
                const anchor = document.createElement('a'); anchor.href = url;
                anchor.download = format === 'docx' ? `${receipt.numeroRecibo}.docx` : `detalle-${receipt.numeroRecibo}.xlsx`;
                anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
        } catch { setNotification({ message: 'No fue posible descargar el documento.', type: 'error' }); }
    };

    const cancelReceipt = async () => {
        setCancelling(true);
        try {
            await axiosClient.post(`/ventas/recibos/${cancelTarget.idRecibo}/anular`, { idSucursal: Number(selectedSucursalId), motivo: cancelReason.trim() });
            setCancelTarget(null); setCancelReason('');
            setNotification({ message: 'Recibo anulado y productos devueltos al inventario.', type: 'success' });
            await loadReceipts();
        } catch (error) { setNotification({ message: error.response?.data?.message || 'No fue posible anular el recibo.', type: 'error' }); }
        finally { setCancelling(false); }
    };

    return (
        <div className="space-y-5">
            <section className="border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h1 className="text-xl font-semibold text-slate-900">Recibos</h1><p className="text-sm text-slate-500">Consulta, descarga o anula documentos de la sucursal seleccionada.</p></div><span className="text-sm text-slate-500">{receipts.length} resultados</span></div>
                <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
                    <input value={filters.query} onChange={(e) => setFilters({ ...filters, query: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && loadReceipts()} placeholder="Cliente, NIT o número de recibo" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-teal" />
                    <input type="date" value={filters.fechaDesde} onChange={(e) => setFilters({ ...filters, fechaDesde: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
                    <input type="date" value={filters.fechaHasta} onChange={(e) => setFilters({ ...filters, fechaHasta: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
                    <button type="button" onClick={loadReceipts} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-teal px-4 py-2.5 text-sm font-semibold text-white"><Search className="h-4 w-4" />Buscar</button>
                </div>
            </section>

            <section className="overflow-x-auto border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-4">Recibo</th><th className="p-4">Fecha</th><th className="p-4">Cliente</th><th className="p-4">Pago</th><th className="p-4 text-right">Monto</th><th className="p-4">Estado</th><th className="p-4 text-right">Acciones</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan="7" className="p-8 text-center text-slate-500">Cargando recibos...</td></tr> : receipts.length === 0 ? <tr><td colSpan="7" className="p-8 text-center text-slate-500">No se encontraron recibos.</td></tr> : receipts.map((receipt) => <tr key={receipt.idRecibo} className={receipt.estado === 'Anulado' ? 'bg-slate-50 text-slate-500' : ''}><td className="p-4"><span className="font-semibold text-slate-900">{receipt.numeroRecibo}</span><br /><span className="text-xs">{receipt.numeroFactura}</span></td><td className="p-4">{new Date(receipt.fechaPago).toLocaleString('es-GT')}</td><td className="p-4"><span className="font-medium">{receipt.clienteNombre}</span><br /><span className="text-xs">{receipt.clienteNit || 'CF'}</span></td><td className="p-4 capitalize">{receipt.metodoPago}</td><td className="p-4 text-right font-semibold">{money.format(receipt.monto)}</td><td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${receipt.estado === 'Anulado' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{receipt.estado}</span></td><td className="p-4"><div className="flex justify-end gap-1"><button onClick={() => download(receipt, 'pdf')} title="PDF" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><Printer className="h-4 w-4" /></button><button onClick={() => download(receipt, 'docx')} title="Word" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><FileText className="h-4 w-4" /></button><button onClick={() => download(receipt, 'excel')} title="Excel" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><Table2 className="h-4 w-4" /></button>{receipt.estado !== 'Anulado' && <button onClick={() => { setCancelTarget(receipt); setCancelReason(''); }} title="Anular" className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>}</div></td></tr>)}</tbody>
                </table>
            </section>
            <NotificationToast notification={notification} onClose={() => setNotification(null)} />
            <ConfirmCancelModal receipt={cancelTarget} reason={cancelReason} onReasonChange={setCancelReason} onCancel={() => setCancelTarget(null)} onConfirm={cancelReceipt} loading={cancelling} />
        </div>
    );
}
