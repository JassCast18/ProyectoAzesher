import { CalendarDays, CheckCircle2, Clock3, Database, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const definitions = {
    caja: { section: 'Control de caja', title: 'Apertura y cierre de caja', description: 'Controla la sesión de caja del usuario, el monto de apertura, movimientos y arqueo de cierre.', fields: ['Monto inicial y hora de apertura', 'Usuario y sucursal responsables', 'Resumen de ventas por método de pago', 'Monto contado, diferencia y observaciones de cierre'] },
    clientes: { section: 'Gestión de clientes', title: 'Listado de clientes', description: 'Consulta el catálogo central de clientes y sus datos de contacto y facturación.', fields: ['Búsqueda por nombre, NIT o teléfono', 'Estado de crédito autorizado', 'Datos de contacto y dirección', 'Acceso al historial de compras'] },
    crearCliente: { section: 'Gestión de clientes', title: 'Crear cliente', description: 'Registra los datos comerciales y de facturación de un cliente.', fields: ['Nombre o razón social', 'NIT o consumidor final', 'Teléfono y dirección', 'Preparado para autorización de crédito'] },
    historial: { section: 'Gestión de clientes', title: 'Historial de compras', description: 'Revisa ventas, recibos, facturas y saldos asociados a un cliente.', fields: ['Filtro de cliente y período', 'Compras y productos adquiridos', 'Recibos y facturas relacionadas', 'Crédito, cuotas y abonos pendientes'] },
    reporteVentas: { section: 'Reportes', title: 'Ventas y facturación', description: 'Consolida ventas, recibos y facturas por período y sucursal.', fields: ['Totales por método de pago', 'Ventas por vendedor y producto', 'Facturas emitidas y recibos anulados', 'Exportación a PDF y Excel'] },
    reporteInventario: { section: 'Reportes', title: 'Inventario', description: 'Analiza existencias, entradas, salidas y productos con baja disponibilidad.', fields: ['Existencia actual por sucursal', 'Entradas de pedidos', 'Productos vendidos y rotación', 'Valorización y alertas de stock'] },
    reporteCobros: { section: 'Reportes', title: 'Cuentas por cobrar', description: 'Resume saldos pendientes, cuotas, vencimientos y pagos de clientes.', fields: ['Cartera pendiente por cliente', 'Cuotas próximas y vencidas', 'Abonos recibidos', 'Crédito disponible y utilizado'] },
    reporteCaja: { section: 'Reportes', title: 'Caja', description: 'Consulta aperturas, cierres, diferencias y movimientos por usuario.', fields: ['Sesiones por fecha y sucursal', 'Totales esperados y contados', 'Diferencias de arqueo', 'Detalle por método de pago'] },
};

export default function ModuleScaffoldPage({ type }) {
    const { selectedSucursalId, sucursales } = useAuth();
    const content = definitions[type];
    const branch = sucursales.find(item => String(item.idSucursal) === String(selectedSucursalId));
    return <div className="mx-auto max-w-5xl space-y-5">
        <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">{content.title}</h1>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-slate-700"><MapPin className="h-4 w-4 text-brand-teal" />{branch?.nombreSuc || branch?.nombre || 'Sucursal seleccionada'}</span>
                <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-slate-700"><CalendarDays className="h-4 w-4 text-brand-teal" />{new Date().toLocaleDateString('es-GT')}</span>
            </div>
        </section>
        <section className="grid gap-4 md:grid-cols-[1fr_300px]">
            <div className="border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><Database className="h-5 w-5 text-brand-teal" /><h2 className="font-bold text-slate-900">Alcance propuesto</h2></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{content.fields.map(field => <div key={field} className="flex items-start gap-3 border border-slate-200 p-4"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-brand-teal" /><span className="text-sm text-slate-700">{field}</span></div>)}</div></div>
            <aside className="border border-amber-200 bg-amber-50 p-5"><Clock3 className="h-5 w-5 text-amber-700" /><h2 className="mt-3 font-bold text-amber-950">Estructura preparada</h2><p className="mt-2 text-sm leading-6 text-amber-900">La ruta y el menú ya están disponibles. El proceso y sus permisos se implementarán cuando confirmes que este submódulo pertenece aquí.</p></aside>
        </section>
    </div>;
}
