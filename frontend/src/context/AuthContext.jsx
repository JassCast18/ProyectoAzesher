import { createContext, useContext, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

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

    const login = async (username, password) => {
        try {
            const response = await axiosClient.post('/auth/login', { username, password });
            
            if (response.data.success) {
                const { usuario, token, sucursales: sucursalesDB} = response.data.data;
                localStorage.setItem('token', token);
                localStorage.setItem('sucursales', JSON.stringify(sucursalesDB));
                const decodedUser = jwtDecode(token);
                setUser(decodedUser);
                setSucursales(sucursalesDB);
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
        setUser(null);
        setSucursales([]);
    };

    return (
        <AuthContext.Provider value={{ user, sucursales, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);