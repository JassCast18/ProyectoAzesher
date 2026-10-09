import { ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return <section className="grid min-h-[65vh] place-items-center">
    <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-6xl font-black text-[var(--branch-color)]">Ups</p><h1 className="mt-3 text-2xl font-bold text-slate-900">La dirección está mal</h1><p className="mt-2 text-slate-600">Esta página no existe, pero tu sesión y tu trabajo siguen abiertos.</p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row"><button type="button" onClick={() => navigate(-1)} className="button-secondary justify-center"><ArrowLeft className="h-4 w-4" />Regresar</button><button type="button" onClick={() => navigate('/dashboard')} className="button-primary justify-center"><Home className="h-4 w-4" />Ir al inicio</button></div>
    </div>
  </section>;
}
