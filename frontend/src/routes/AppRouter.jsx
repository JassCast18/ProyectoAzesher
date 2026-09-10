import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import VentasPage from '../pages/VentasPage';
import ReciboPreviewPage from '../pages/ReciboPreviewPage';
import MainLayout from '../layouts/MainLayout';
import RecibosPage from '../pages/RecibosPage';
import InventarioProductosPage from '../pages/InventarioProductosPage';
import EntradaPedidoPage from '../pages/EntradaPedidoPage';
import CrearFacturaPage from '../pages/CrearFacturaPage';
import FacturasPage from '../pages/FacturasPage';
import ProveedoresPage from '../pages/ProveedoresPage';
import ControlCajaPage from '../pages/ControlCajaPage';
import ClientesPage from '../pages/ClientesPage';
import ReportesPage from '../pages/ReportesPage';
import DatosMaestrosPage from '../pages/DatosMaestrosPage';
import TrasladosPage from '../pages/TrasladosPage';
import CobrosPage from '../pages/CobrosPage';
import AlertasPage from '../pages/AlertasPage';

const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    // Si no hay usuario, lo manda al login
    return user ? children : <Navigate to="/" replace />;
};

export default function AppRouter() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    
                    <Route 
                        path="/dashboard" 
                        element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <DashboardPage />
                                </MainLayout>
                            </ProtectedRoute>
                        } 
                    />

                    <Route
                        path="/ventas"
                        element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <VentasPage />
                                </MainLayout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/ventas/recibos"
                        element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <RecibosPage />
                                </MainLayout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/ventas/recibo-preview"
                        element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <ReciboPreviewPage />
                                </MainLayout>
                            </ProtectedRoute>
                        }
                    />

                    <Route path="/inventarios" element={<Navigate to="/inventarios/productos" replace />} />
                    <Route path="/inventarios/productos" element={<ProtectedRoute><MainLayout><InventarioProductosPage /></MainLayout></ProtectedRoute>} />
                    <Route path="/inventarios/entrada-pedido" element={<ProtectedRoute><MainLayout><EntradaPedidoPage /></MainLayout></ProtectedRoute>} />
                    <Route path="/inventarios/proveedores" element={<ProtectedRoute><MainLayout><ProveedoresPage /></MainLayout></ProtectedRoute>} />
                    <Route path="/inventarios/traslados/nuevo" element={<ProtectedRoute><MainLayout><TrasladosPage mode="create" /></MainLayout></ProtectedRoute>} />
                    <Route path="/inventarios/traslados" element={<ProtectedRoute><MainLayout><TrasladosPage mode="history" /></MainLayout></ProtectedRoute>} />
                    <Route path="/ventas/facturas/crear" element={<ProtectedRoute><MainLayout><CrearFacturaPage /></MainLayout></ProtectedRoute>} />
                    <Route path="/ventas/facturas" element={<ProtectedRoute><MainLayout><FacturasPage /></MainLayout></ProtectedRoute>} />
                    <Route path="/caja" element={<Navigate to="/caja/apertura-cierre" replace />} />
                    <Route path="/caja/apertura-cierre" element={<ProtectedRoute><MainLayout><ControlCajaPage /></MainLayout></ProtectedRoute>} />
                    <Route path="/caja/cierres" element={<ProtectedRoute><MainLayout><ControlCajaPage mode="closures" /></MainLayout></ProtectedRoute>} />
                    <Route path="/clientes" element={<Navigate to="/clientes/listado" replace />} />
                    <Route path="/clientes/crear" element={<ProtectedRoute><MainLayout><ClientesPage mode="create" /></MainLayout></ProtectedRoute>} />
                    <Route path="/clientes/listado" element={<ProtectedRoute><MainLayout><ClientesPage mode="list" /></MainLayout></ProtectedRoute>} />
                    <Route path="/clientes/historial" element={<Navigate to="/clientes/listado" replace />} />
                    <Route path="/reportes" element={<Navigate to="/reportes/consolidado" replace />} />
                    <Route path="/reportes/consolidado" element={<ProtectedRoute><MainLayout><ReportesPage /></MainLayout></ProtectedRoute>} />
                    <Route path="/configuracion/datos-maestros" element={<ProtectedRoute><MainLayout><DatosMaestrosPage /></MainLayout></ProtectedRoute>} />
                    <Route path="/cobros" element={<Navigate to="/cobros/listado" replace />} />
                    <Route path="/cobros/estado-cuenta" element={<ProtectedRoute><MainLayout><CobrosPage mode="statement" /></MainLayout></ProtectedRoute>} />
                    <Route path="/cobros/pagar" element={<ProtectedRoute><MainLayout><CobrosPage mode="pay" /></MainLayout></ProtectedRoute>} />
                    <Route path="/cobros/listado" element={<ProtectedRoute><MainLayout><CobrosPage mode="list" /></MainLayout></ProtectedRoute>} />
                    <Route path="/cobros/autorizar" element={<ProtectedRoute><MainLayout><CobrosPage mode="authorize" /></MainLayout></ProtectedRoute>} />
                    <Route path="/alertas" element={<ProtectedRoute><MainLayout><AlertasPage /></MainLayout></ProtectedRoute>} />
                    
                    {/* Cualquier otra ruta lo manda al login */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
