import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import logoAzeShers from '../assets/logo.png';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje('');

        if (!username || !password) {
            setMensaje('Por favor completa todos los campos.');
            return;
        }

        const resultado = await login(username, password);

        if (resultado.success) {
            navigate('/dashboard');
        } else {
            setMensaje(resultado.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
                
                <div className="flex flex-col items-center mb-6">
                    <img src={logoAzeShers} alt="Logo Aze-Sher's" className="w-40 h-auto mb-4" />
                    <h1 className="text-xl font-bold text-slate-800">Distribuidora Aze-Sher's</h1>
                    <p className="text-sm text-slate-500">Sistema de control y gestión de ventas e inventarios</p>
                    <div className="w-16 h-1 bg-brand-yellow mt-2 rounded-full"></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-brand-teal" />
                        </div>
                        <input
                            type="text"
                            placeholder="Usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal text-sm"
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-brand-teal" />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>

                    {mensaje && <p className="text-red-500 text-xs text-center">{mensaje}</p>}

                    <button
                        type="submit"
                        className="w-full bg-brand-teal hover:bg-teal-700 text-white font-medium py-3 rounded-lg flex justify-center items-center gap-2 transition-colors"
                    >
                        <Lock className="h-4 w-4" />
                        Iniciar sesión
                    </button>
                </form>

                <div className="mt-8">
                    <div className="relative flex items-center justify-center">
                        <div className="absolute border-t border-gray-200 w-full"></div>
                        <div className="relative bg-white px-3 flex items-center gap-2 text-xs text-brand-teal">
                            <ShieldCheck className="h-4 w-4" />
                            <span>Acceso según rol del usuario</span>
                        </div>
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-4 flex justify-center items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Acceso exclusivo para personal autorizado
                    </p>
                </div>

            </div>
        </div>
    );
}