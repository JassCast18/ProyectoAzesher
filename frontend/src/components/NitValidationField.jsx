import { CheckCircle2, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import axiosClient from '../api/axiosClient';

const normalize = value => (value || '').replace(/[\s-]/g, '').toUpperCase() || 'CF';

export default function NitValidationField({ value, onChange, onValidated, label = 'NIT', inputClassName = 'input' }) {
    const validatedRef = useRef(onValidated);
    validatedRef.current = onValidated;
    const [status, setStatus] = useState(() => normalize(value) === 'CF' ? 'valid' : 'idle');
    const [message, setMessage] = useState(() => normalize(value) === 'CF' ? 'Consumidor Final no requiere consulta.' : 'Valida el NIT antes de continuar.');

    useEffect(() => {
        const consumerFinal = normalize(value) === 'CF';
        setStatus(consumerFinal ? 'valid' : 'idle');
        setMessage(consumerFinal ? 'Consumidor Final no requiere consulta.' : 'Valida el NIT antes de continuar.');
        validatedRef.current?.(consumerFinal, consumerFinal ? { nit: 'CF', name: 'CONSUMIDOR FINAL', isConsumerFinal: true } : null);
    }, [value]);

    const validate = async () => {
        setStatus('loading');
        setMessage('Consultando el registro fiscal…');
        try {
            const response = await axiosClient.post('/facturacion/validar-nit', { nit: normalize(value) });
            const result = response.data.data;
            setStatus('valid');
            setMessage(result.isConsumerFinal ? 'Consumidor Final no requiere consulta.' : `${result.name} · validado`);
            if (result.nit !== normalize(value)) onChange(result.nit);
            onValidated?.(true, result);
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'No fue posible validar el NIT. Intenta nuevamente.');
            onValidated?.(false, null);
        }
    };

    return <label className="block text-sm font-semibold text-slate-800">
        {label}
        <div className="mt-1 flex gap-2">
            <div className="relative min-w-0 flex-1">
                <input value={value} onChange={event => onChange(event.target.value.toUpperCase())} placeholder="CF o NIT" className={`${inputClassName} pr-10 ${status === 'valid' ? 'border-emerald-400' : status === 'error' ? 'border-red-400' : ''}`} />
                {status === 'valid' && <CheckCircle2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600" />}
                {status === 'error' && <XCircle className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-red-600" />}
            </div>
            <button type="button" onClick={validate} disabled={status === 'loading' || normalize(value) === 'CF'} className="button-secondary whitespace-nowrap disabled:opacity-55">
                {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {status === 'loading' ? 'Validando' : 'Validar NIT'}
            </button>
        </div>
        <small className={`mt-1.5 block font-normal ${status === 'valid' ? 'text-emerald-700' : status === 'error' ? 'text-red-600' : 'text-slate-500'}`}>{message}</small>
    </label>;
}
