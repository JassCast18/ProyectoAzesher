import { useState } from 'react';
import {
    LayoutDashboard, Users, Box, ShoppingCart, LogOut, ReceiptText, PackageSearch, ClipboardList,
    Menu, Bell, Building2, ChevronDown, User as UserIcon, FilePlus2, Files, Truck,
    WalletCards, UserRoundPlus, History, BarChart3, Banknote, Settings2, HandCoins, ListChecks, ShieldCheck
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoAzeShers from '../assets/logo.png';

export default function MainLayout({ children }) {
    const { user, logout, sucursales, selectedSucursalId, setSelectedSucursalId, isSucursalLocked, isAdministrator } = useAuth();
    const location = useLocation();
    // Estado para controlar si el menú lateral está abierto o cerrado
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isVentasOpen, setIsVentasOpen] = useState(() => location.pathname.startsWith('/ventas'));
    const [isInventariosOpen, setIsInventariosOpen] = useState(() => location.pathname.startsWith('/inventarios'));
    const [isCajaOpen, setIsCajaOpen] = useState(() => location.pathname.startsWith('/caja'));
    const [isClientesOpen, setIsClientesOpen] = useState(() => location.pathname.startsWith('/clientes'));
    const [isReportesOpen, setIsReportesOpen] = useState(() => location.pathname.startsWith('/reportes'));
    const [isCobrosOpen, setIsCobrosOpen] = useState(() => location.pathname.startsWith('/cobros'));
    const selectedBranch = sucursales.find((branch) => String(branch.idSucursal) === String(selectedSucursalId));
    const branchColor = selectedBranch?.colorIdentificacion || '#008BA8';

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden" style={{ '--branch-color': branchColor }}>
            
            {/* MENÚ LATERAL (SIDEBAR) COLAPSABLE */}
            <aside 
                className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out z-20
                ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-0 overflow-hidden'}`}
            >
                {/* Contenedor del Logo (se oculta si se cierra el menú) */}
                <div className={`p-4 border-b border-gray-100 flex justify-center items-center h-34 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                    <img 
                        src={logoAzeShers} 
                        alt="Logo Aze-Sher's" 
                        className="h-full w-auto object-contain drop-shadow-sm min-w-[120px]" 
                    />
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto whitespace-nowrap">
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-brand-teal text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <LayoutDashboard className="h-5 w-5 min-w-[20px]" /> 
                        <span className={!isSidebarOpen ? 'hidden' : 'block'}>Dashboard</span>
                    </NavLink>
                    <button type="button" onClick={() => setIsInventariosOpen((current) => !current)} className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${location.pathname.startsWith('/inventarios') ? 'bg-brand-teal text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <Box className="h-5 w-5 min-w-[20px]" /> 
                        <span className={!isSidebarOpen ? 'hidden' : 'block'}>Inventarios</span>
                        <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${isInventariosOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isInventariosOpen && (
                        <div className="ml-5 space-y-1 border-l border-slate-200 pl-3">
                            <NavLink to="/inventarios/productos" className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-teal-50 font-semibold text-brand-teal' : 'text-slate-600 hover:bg-slate-50'}`}><PackageSearch className="h-4 w-4" />Listado de productos</NavLink>
                            <NavLink to="/inventarios/entrada-pedido" className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-teal-50 font-semibold text-brand-teal' : 'text-slate-600 hover:bg-slate-50'}`}><ClipboardList className="h-4 w-4" />Entrada de pedido</NavLink>
                            <NavLink to="/inventarios/proveedores" className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-teal-50 font-semibold text-brand-teal' : 'text-slate-600 hover:bg-slate-50'}`}><Truck className="h-4 w-4" />Proveedores</NavLink>
                            {isAdministrator && <><NavLink to="/inventarios/traslados/nuevo" className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-teal-50 font-semibold text-brand-teal' : 'text-slate-600 hover:bg-slate-50'}`}><ClipboardList className="h-4 w-4" />Nuevo traslado</NavLink><NavLink to="/inventarios/traslados" end className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-teal-50 font-semibold text-brand-teal' : 'text-slate-600 hover:bg-slate-50'}`}><History className="h-4 w-4" />Historial de traslados</NavLink></>}
                        </div>
                    )}
                    <button type="button" onClick={() => setIsVentasOpen((current) => !current)} className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${location.pathname.startsWith('/ventas') ? 'bg-brand-teal text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <ShoppingCart className="h-5 w-5 min-w-[20px]" /> 
                        <span className={!isSidebarOpen ? 'hidden' : 'block'}>Ventas</span>
                        <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${isVentasOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isVentasOpen && (
                        <div className="ml-5 space-y-1 border-l border-slate-200 pl-3">
                            <NavLink to="/ventas" end className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-teal-50 font-semibold text-brand-teal' : 'text-slate-600 hover:bg-slate-50'}`}><ShoppingCart className="h-4 w-4" />Venta de productos</NavLink>
                            <NavLink to="/ventas/recibos" className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-teal-50 font-semibold text-brand-teal' : 'text-slate-600 hover:bg-slate-50'}`}><ReceiptText className="h-4 w-4" />Recibos</NavLink>
                            <NavLink to="/ventas/facturas/crear" className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-teal-50 font-semibold text-brand-teal' : 'text-slate-600 hover:bg-slate-50'}`}><FilePlus2 className="h-4 w-4" />Crear factura</NavLink>
                            <NavLink to="/ventas/facturas" end className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-teal-50 font-semibold text-brand-teal' : 'text-slate-600 hover:bg-slate-50'}`}><Files className="h-4 w-4" />Listado de facturas</NavLink>
                        </div>
                    )}
                    <MenuGroup label="Control de caja" icon={WalletCards} open={isCajaOpen} active={location.pathname.startsWith('/caja')} onClick={() => setIsCajaOpen(value => !value)}>
                        <SubLink to="/caja/apertura-cierre" icon={Banknote}>Apertura y cierre</SubLink>
                        <SubLink to="/caja/cierres" icon={History}>Listado de cierres</SubLink>
                    </MenuGroup>
                    <MenuGroup label="Gestión de clientes" icon={Users} open={isClientesOpen} active={location.pathname.startsWith('/clientes')} onClick={() => setIsClientesOpen(value => !value)}>
                        <SubLink to="/clientes/crear" icon={UserRoundPlus}>Crear cliente</SubLink>
                        <SubLink to="/clientes/listado" icon={History}>Listado de clientes</SubLink>
                    </MenuGroup>
                    <MenuGroup label="Cobros" icon={HandCoins} open={isCobrosOpen} active={location.pathname.startsWith('/cobros')} onClick={() => setIsCobrosOpen(value => !value)}>
                        <SubLink to="/cobros/estado-cuenta" icon={ReceiptText}>Estado de cuenta</SubLink>
                        <SubLink to="/cobros/pagar" icon={Banknote}>Pagar abono</SubLink>
                        <SubLink to="/cobros/listado" icon={ListChecks}>Listado de cobros</SubLink>
                        {isAdministrator && <SubLink to="/cobros/autorizar" icon={ShieldCheck}>Autorizar crédito</SubLink>}
                    </MenuGroup>
                    <MenuGroup label="Reportes" icon={BarChart3} open={isReportesOpen} active={location.pathname.startsWith('/reportes')} onClick={() => setIsReportesOpen(value => !value)}>
                        <SubLink to="/reportes/consolidado" icon={BarChart3}>Listado de reportes</SubLink>
                    </MenuGroup>
                    <NavLink to="/configuracion/datos-maestros" className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${isActive ? 'bg-brand-teal text-white' : 'text-slate-600 hover:bg-slate-50'}`}><Settings2 className="h-5 w-5" />Datos maestros</NavLink>
                </nav>
            </aside>

            {/* CONTENIDO PRINCIPAL Y NAVBAR SUPERIOR */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                
                {/* HEADER (Barra Superior tipo imagen) */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-10">
                    
                    {/* Botón de Hamburguesa para colapsar/abrir el menú */}
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 text-slate-400 hover:text-brand-teal hover:bg-teal-50 rounded-lg transition-colors focus:outline-none"
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    {/* Lado derecho del Header */}
                    <div className="flex items-center gap-3 sm:gap-5">
                        
                        {/* 1. Combobox de Sucursales */}
                        <div className="hidden sm:flex relative items-center border border-gray-200 rounded-lg bg-white hover:bg-slate-50 transition-colors focus-within:border-brand-teal focus-within:ring-1 focus-within:ring-brand-teal">
                            <span className="ml-3 h-3 w-3 rounded-sm border border-black/10" style={{ backgroundColor: branchColor }} />
                            <div className="pl-3 pointer-events-none">
                                <Building2 className="h-4 w-4 text-slate-400" />
                            </div>
                            <select 
                                className="appearance-none bg-transparent py-2 pl-2 pr-8 text-sm font-medium text-slate-700 outline-none cursor-pointer w-full disabled:cursor-not-allowed disabled:text-slate-400"
                                value={selectedSucursalId}
                                onChange={(event) => setSelectedSucursalId(event.target.value)}
                                disabled={isSucursalLocked}
                                title={isSucursalLocked ? 'Finaliza la venta o vacía el pedido para cambiar de sucursal.' : 'Seleccionar sucursal'}
                            >
                                {sucursales.map((sucursal) => (
                                <option key={sucursal.idSucursal} value={sucursal.idSucursal}>
                                        {sucursal.nombreSuc}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 pointer-events-none">
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                            </div>
                        </div>

                        {/* 2. Campana de Notificaciones */}
                        <NavLink to="/alertas" className="relative p-2 text-slate-400 hover:text-brand-teal transition-colors" title="Alertas">
                            <Bell className="h-5 w-5" />
                        </NavLink>

                        {/* Línea divisora vertical */}
                        <div className="hidden sm:block h-8 w-px bg-gray-200 mx-1"></div>

                        {/* 3. Perfil de Usuario */}
                        <div className="flex items-center gap-3 group cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                            {/* Avatar circular */}
                            <div className="h-9 w-9 bg-brand-teal rounded-full flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-shadow">
                                <UserIcon className="h-5 w-5" />
                            </div>
                            
                            {/* Textos del usuario */}
                            <div className="hidden flex-col text-left sm:flex">
                                <span className="text-sm font-bold text-slate-800 leading-none">
                                    {user?.unique_name || 'Administrador general'}
                                </span>
                                <span className="text-xs text-slate-500 mt-1 leading-none">
                                    {user?.role || 'Dueño'}
                                </span>
                            </div>
                            
                            <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 hidden sm:block" />
                        </div>

                        {/* Botón de Logout directo (opcional, lo puedes mover a un dropdown del perfil luego) */}
                        <button 
                            onClick={logout} 
                            title="Cerrar sesión"
                            className="p-2 ml-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </header>

                {/* CONTENIDO DE LA PÁGINA */}
                <main className="branch-context flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
                    {children}
                </main>
            </div>
        </div>
    );
}

function MenuGroup({ label, icon: Icon, open, active, onClick, children }) {
    return <><button type="button" onClick={onClick} className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${active ? 'bg-brand-teal text-white' : 'text-slate-600 hover:bg-slate-50'}`}><Icon className="h-5 w-5 min-w-[20px]" /><span>{label}</span><ChevronDown className={`ml-auto h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} /></button>{open && <div className="ml-5 space-y-1 border-l border-slate-200 pl-3">{children}</div>}</>;
}

function SubLink({ to, icon: Icon, children }) {
    return <NavLink to={to} end className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-teal-50 font-semibold text-brand-teal' : 'text-slate-600 hover:bg-slate-50'}`}><Icon className="h-4 w-4" />{children}</NavLink>;
}
