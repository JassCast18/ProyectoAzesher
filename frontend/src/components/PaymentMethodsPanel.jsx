import { Banknote, CreditCard, Paperclip, UserRound, Landmark } from 'lucide-react';

const methods = [
    { id: 'efectivo', label: 'Efectivo', icon: Banknote },
    { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
    { id: 'transferencia', label: 'Transferencia', icon: Landmark },
    { id: 'credito', label: 'Cuenta por cobrar', icon: UserRound },
];

export default function PaymentMethodsPanel({ method, onMethodChange, currencies, posTypes, details, onDetailsChange, onOpenCredit, onError }) {
    const setDetail = (key, value) => onDetailsChange({ ...details, [key]: value });

    const loadReceipt = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            onError('El comprobante debe ser una imagen.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            onError('El comprobante no puede superar 5 MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => onDetailsChange({ ...details, transferFileName: file.name, transferMime: file.type, transferBase64: reader.result });
        reader.readAsDataURL(file);
    };

    return (
        <section className="border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {methods.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => onMethodChange(id)} className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium ${method === id ? 'border-brand-teal bg-teal-50 text-teal-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><Icon className="h-4 w-4" />{label}</button>)}
                </div>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4">
                {method === 'efectivo' && <label className="block max-w-md text-sm font-medium text-slate-700">Moneda <span className="text-red-600">*</span><input list="currencies" value={details.currencyCode} onChange={(e) => { const currency = currencies.find((item) => item.codigo === e.target.value); onDetailsChange({ ...details, currencyCode: e.target.value, currencyId: currency?.idMoneda ?? null }); }} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" /><datalist id="currencies">{currencies.map((currency) => <option key={currency.idMoneda} value={currency.codigo}>{currency.nombre}</option>)}</datalist></label>}

                {method === 'tarjeta' && <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Tipo de POS <span className="text-red-600">*</span><select value={details.posId || ''} onChange={(e) => { const pos = posTypes.find((item) => item.idTipoPos === Number(e.target.value)); onDetailsChange({ ...details, posId: pos?.idTipoPos ?? null, posName: pos?.nombre ?? '' }); }} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"><option value="">Seleccionar POS</option>{posTypes.map((pos) => <option key={pos.idTipoPos} value={pos.idTipoPos}>{pos.nombre}</option>)}</select></label><label className="text-sm font-medium text-slate-700">Número de voucher <span className="text-red-600">*</span><input value={details.reference} onChange={(e) => setDetail('reference', e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" /></label></div>}

                {method === 'transferencia' && <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]"><label className="text-sm font-medium text-slate-700">Número de transferencia <span className="text-red-600">*</span><input value={details.reference} onChange={(e) => setDetail('reference', e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="text-sm font-medium text-slate-700">Fecha <span className="text-red-600">*</span><input type="date" value={details.transferDate} onChange={(e) => setDetail('transferDate', e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="mt-6 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" title="Adjuntar comprobante"><Paperclip className="h-4 w-4" /><span className="max-w-32 truncate">{details.transferFileName || 'Adjuntar'}</span><input type="file" accept="image/*" className="hidden" onChange={(e) => loadReceipt(e.target.files?.[0])} /></label></div>}

                {method === 'credito' && <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium text-slate-900">{details.credit.customer?.nombre || 'Cliente autorizado pendiente de seleccionar'}</p>{details.credit.customer && <p className="text-xs text-slate-500">Disponible: Q {Number(details.credit.customer.disponible).toFixed(2)} · {details.credit.installments} cuotas</p>}</div><button type="button" onClick={onOpenCredit} className="rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white">Configurar crédito</button></div>}
            </div>
        </section>
    );
}
