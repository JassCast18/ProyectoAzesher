import { createContext, useContext, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

const getRoleName = (user) => {
    const rawRole = user?.role || user?.rol || user?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '';
    return String(rawRole).trim().toLowerCase();
};

const isAdministratorRole = (user) => getRoleName(user).includes('admin');

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) return null;
        try {
            return jwtDecode(storedToken); 
        } catch {
            return null;
        }
    });

    const [sucursales, setSucursales] = useState(() => {
        const storedSucursales = localStorage.getItem('sucursales');
        return storedSucursales ? JSON.parse(storedSucursales) : [];
    });

    const [selectedSucursalId, setSelectedSucursalId] = useState(() => {
        const storedSucursal = localStorage.getItem('selectedSucursalId');
        if (storedSucursal !== null) {
            return storedSucursal;
        }

        return localStorage.getItem('token') ? '' : '';
    });

    const login = async (username, password) => {
        try {
            const response = await axiosClient.post('/auth/login', { username, password });
            
            if (response.data.success) {
                const { usuario, token, sucursales: sucursalesDB} = response.data.data;
                localStorage.setItem('token', token);
                localStorage.setItem('sucursales', JSON.stringify(sucursalesDB));
                const decodedUser = jwtDecode(token);
                const defaultSucursal = decodedUser?.id_sucursal ? String(decodedUser.id_sucursal) : '';
                localStorage.setItem('selectedSucursalId', defaultSucursal);
                setUser(decodedUser);
                setSucursales(sucursalesDB);
                setSelectedSucursalId(defaultSucursal);
                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.message || 'Error al conectar con el servidor.' 
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('sucursales');
        localStorage.removeItem('selectedSucursalId');
        setUser(null);
        setSucursales([]);
        setSelectedSucursalId('');
    };

    return (
        <AuthContext.Provider value={{ user, sucursales, selectedSucursalId, setSelectedSucursalId, login, logout, isAdministrator: isAdministratorRole(user) }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);