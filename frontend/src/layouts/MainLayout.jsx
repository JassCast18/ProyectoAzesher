import { useState } from 'react';
import { 
    LayoutDashboard, Users, Box, ShoppingCart, LogOut, 
    Menu, Bell, Building2, ChevronDown, User as UserIcon 
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoAzeShers from '../assets/logo.png';

export default function MainLayout({ children }) {
    const { user, logout, sucursales, selectedSucursalId, setSelectedSucursalId, isAdministrator } = useAuth();
    // Estado para controlar si el menú lateral está abierto o cerrado
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            
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
                    <a href="#" className="flex items-center gap-3 text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-lg text-sm font-medium transition-colors">
                        <Users className="h-5 w-5 min-w-[20px]" /> 
                        <span className={!isSidebarOpen ? 'hidden' : 'block'}>Proveedores</span>
                    </a>
                    <a href="#" className="flex items-center gap-3 text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-lg text-sm font-medium transition-colors">
                        <Box className="h-5 w-5 min-w-[20px]" /> 
                        <span className={!isSidebarOpen ? 'hidden' : 'block'}>Inventarios</span>
                    </a>
                    <NavLink
                        to="/ventas"
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-brand-teal text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <ShoppingCart className="h-5 w-5 min-w-[20px]" /> 
                        <span className={!isSidebarOpen ? 'hidden' : 'block'}>Ventas</span>
                    </NavLink>
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
                            <div className="pl-3 pointer-events-none">
                                <Building2 className="h-4 w-4 text-slate-400" />
                            </div>
                            <select 
                                className="appearance-none bg-transparent py-2 pl-2 pr-8 text-sm font-medium text-slate-700 outline-none cursor-pointer w-full"
                                value={selectedSucursalId}
                                onChange={(event) => setSelectedSucursalId(event.target.value)}
                            >
                                {isAdministrator && <option value="">Todas las sucursales</option>}
                                
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
                        <button className="relative p-2 text-slate-400 hover:text-brand-teal transition-colors">
                            <Bell className="h-5 w-5" />
                            {/* Globito de notificación */}
                            <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-brand-teal text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-white">
                                3
                            </span>
                        </button>

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
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
                    {children}
                </main>
            </div>
        </div>
    );
}