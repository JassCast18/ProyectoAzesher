import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import VentasPage from '../pages/VentasPage';
import ReciboPreviewPage from '../pages/ReciboPreviewPage';
import MainLayout from '../layouts/MainLayout';

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
                        path="/ventas/recibo-preview"
                        element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <ReciboPreviewPage />
                                </MainLayout>
                            </ProtectedRoute>
                        }
                    />
                    
                    {/* Cualquier otra ruta lo manda al login */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}