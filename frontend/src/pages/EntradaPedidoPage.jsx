import { ClipboardList } from 'lucide-react';

export default function EntradaPedidoPage() {
    return <section className="mx-auto max-w-4xl border border-slate-200 bg-white p-8 shadow-sm"><div className="flex items-start gap-4"><span className="rounded-lg bg-teal-50 p-3 text-brand-teal"><ClipboardList className="h-6 w-6" /></span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-teal">Inventarios / Entrada de pedido</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Entrada de pedido</h1><p className="mt-3 text-sm leading-6 text-slate-500">Este submódulo queda separado del listado de productos. Aquí se registrarán posteriormente las entradas que aumenten la existencia de cada sucursal.</p></div></div></section>;
}
