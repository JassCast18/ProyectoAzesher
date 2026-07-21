import { ShoppingCart, DollarSign, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    Bienvenido, {user?.nombre || 'Administrador general'}
                    <span className="bg-brand-yellow text-white text-xs px-2 py-1 rounded-md">{user?.rol || 'Dueño'}</span>
                </h1>
                <p className="text-sm text-slate-500 mt-1">Este es el resumen general de Distribuidora Aze-Sher's.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-teal-50 text-brand-teal rounded-full">
                        <ShoppingCart className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Ventas del día</p>
                        <h3 className="text-xl font-bold text-slate-800">Q 28,450.00</h3>
                        <p className="text-xs text-green-500 flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 mr-1" /> +12.5% vs ayer
                        </p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-full">
                        <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Ingresos del mes</p>
                        <h3 className="text-xl font-bold text-slate-800">Q 125,680.50</h3>
                        <p className="text-xs text-green-500 flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 mr-1" /> +18.2% vs mes anterior
                        </p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-orange-50 text-orange-500 rounded-full">
                        <ArrowDownRight className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Salidas del mes</p>
                        <h3 className="text-xl font-bold text-slate-800">Q 67,230.75</h3>
                        <p className="text-xs text-red-500 flex items-center mt-1">
                            <ArrowDownRight className="h-3 w-3 mr-1" /> -5.4% vs mes anterior
                        </p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-500 rounded-full">
                        <Package className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Productos en inventario</p>
                        <h3 className="text-xl font-bold text-slate-800">2,584</h3>
                        <p className="text-xs text-slate-400 mt-1">Productos activos</p>
                    </div>
                </div>
            </div>
        </div>
    );
}