import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import axiosClient from '../api/axiosClient';

const money = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });

export default function CreditCustomerModal({ open, onClose, value, onChange, total, onError }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);

    useEffect(() => {
        if (!open) return undefined;
        const timeoutId = window.setTimeout(async () => {
            try {
                const response = await axiosClient.get('/catalogo/clientes-credito', { params: { query } });
                setResults(response.data?.data ?? []);
            } catch (error) {
                setResults([]);
                onError(error.response?.data?.message || 'No fue posible buscar clientes autorizados.');
            }
        }, 250);
        return () => window.clearTimeout(timeoutId);
    }, [open, query, onError]);

    if (!open) return null;

    const pending = Math.max(0, total - Number(value.initialAmount || 0));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-label="Configurar cuenta por cobrar">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 p-5">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Cuenta por cobrar</h2>
                        <p className="text-sm text-slate-500">Selecciona un cliente autorizado y define el calendario.</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Cerrar"><X className="h-5 w-5" /></button>
                </div>

                <div className="space-y-5 p-5">
                    <div className="relative">
                        <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o NIT" className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3 text-sm outline-none focus:border-brand-teal" />
                    </div>

                    <div className="overflow-x-auto border border-slate-200">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-left text-slate-600"><tr><th className="p-3">Cliente</th><th className="p-3">Límite</th><th className="p-3">Saldo</th><th className="p-3">Disponible</th><th className="p-3"></th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {results.map((client) => (
                                    <tr key={client.idCliente} className={value.customer?.idCliente === client.idCliente ? 'bg-teal-50' : ''}>
                                        <td className="p-3"><span className="font-medium text-slate-900">{client.nombre}</span><br /><span className="text-xs text-slate-500">{client.nit || 'CF'}</span></td>
                                        <td className="p-3">{money.format(client.limiteCredito)}</td><td className="p-3">{money.format(client.saldoActual)}</td><td className="p-3 font-medium">{money.format(client.disponible)}</td>
                                        <td className="p-3"><button type="button" onClick={() => onChange({ ...value, customer: client })} className="rounded-lg bg-brand-teal px-3 py-2 text-xs font-semibold text-white">Seleccionar</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {value.customer && (
                        <div className="space-y-4 border-t border-slate-200 pt-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="text-sm font-medium text-slate-700">Cantidad de cuotas
                                    <input type="number" min="1" max="36" value={value.installments} onChange={(e) => onChange({ ...value, installments: Number(e.target.value) })} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" />
                                </label>
                                <div className="text-sm font-medium text-slate-700">Saldo pendiente
                                    <div className="mt-2 rounded-lg bg-slate-100 px-3 py-2 font-semibold text-slate-900">{money.format(pending)}</div>
                                </div>
                            </div>

                            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={value.hasInitialPayment} onChange={(e) => onChange({ ...value, hasInitialPayment: e.target.checked, initialAmount: e.target.checked ? value.initialAmount : 0 })} /> Aplica pago inicial</label>
                            {value.hasInitialPayment && <input type="number" min="0" max={total} step="0.01" value={value.initialAmount} onChange={(e) => onChange({ ...value, initialAmount: Number(e.target.value) })} placeholder="Monto inicial" className="w-full rounded-lg border border-slate-300 px-3 py-2 sm:w-64" />}

                            <div className="overflow-x-auto border border-slate-200">
                                <table className="min-w-full text-sm"><thead className="bg-slate-50"><tr><th className="p-3 text-left">Cuota</th><th className="p-3 text-left">Fecha</th><th className="p-3 text-right">Monto</th></tr></thead>
                                    <tbody className="divide-y divide-slate-100">{value.schedule.map((row, index) => <tr key={row.number}><td className="p-3">{row.number}</td><td className="p-3"><input type="date" value={row.date} onChange={(e) => { const schedule = [...value.schedule]; schedule[index] = { ...row, date: e.target.value }; onChange({ ...value, schedule }); }} className="rounded-lg border border-slate-300 px-2 py-1" /></td><td className="p-3 text-right">{money.format(row.amount)}</td></tr>)}</tbody>
                                </table>
                            </div>
                            <div className="flex justify-end"><button type="button" onClick={onClose} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">Aplicar crédito</button></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
