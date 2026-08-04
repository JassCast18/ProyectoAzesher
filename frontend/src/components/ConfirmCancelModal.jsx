import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmCancelModal({ receipt, reason, onReasonChange, onCancel, onConfirm, loading }) {
    if (!receipt) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-md border border-red-200 bg-white shadow-xl">
                <div className="flex items-start justify-between border-b border-slate-200 p-5">
                    <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-6 w-6 text-red-600" /><div><h2 className="font-semibold text-slate-900">Anular recibo</h2><p className="mt-1 text-sm text-slate-500">Esta acción devolverá los productos al inventario.</p></div></div>
                    <button type="button" onClick={onCancel} className="rounded-full p-1 text-slate-500 hover:bg-slate-100" aria-label="Cerrar"><X className="h-4 w-4" /></button>
                </div>
                <div className="space-y-4 p-5">
                    <p className="text-sm text-slate-700">¿Estás seguro de anular <strong>{receipt.numeroRecibo}</strong> de {receipt.clienteNombre}?</p>
                    <label className="block text-sm font-medium text-slate-700">Motivo <span className="text-red-600">*</span><textarea value={reason} onChange={(e) => onReasonChange(e.target.value)} rows="3" maxLength="500" className="mt-2 w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-red-400" /></label>
                    <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Cancelar</button><button type="button" onClick={onConfirm} disabled={loading || !reason.trim()} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{loading ? 'Anulando...' : 'Sí, anular'}</button></div>
                </div>
            </div>
        </div>
    );
}
