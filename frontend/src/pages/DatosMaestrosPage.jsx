import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit3, Plus, Power, Search, X } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import NotificationToast from '../components/NotificationToast';
import { useAuth } from '../context/AuthContext';

const palette = ['#008BA8', '#0F766E', '#2563EB', '#7C3AED', '#DB2777', '#EA580C', '#D97706', '#475569'];
const catalogs = {
    sucursales: { label: 'Sucursales', fields: [['nombre', 'Nombre', 'text', true], ['direccion', 'Dirección'], ['telefono', 'Teléfono'], ['colorIdentificacion', 'Color', 'color', true]] },
    proveedores: { label: 'Proveedores', fields: [['nombre', 'Nombre', 'text', true], ['telefono', 'Teléfono'], ['direccion', 'Dirección']] },
    productos: { label: 'Productos', fields: [['codigo', 'Código', 'text', true], ['nombre', 'Nombre', 'text', true], ['descripcion', 'Descripción'], ['precio', 'Precio', 'number', true]] },
    'proveedor-producto': { label: 'Productos por proveedor', fields: [['idProveedor', 'Proveedor', 'select:proveedores', true], ['idProducto', 'Producto', 'select:productos', true]], columns: [['proveedor', 'Proveedor'], ['producto', 'Producto'], ['activo', 'Estado']], canDisable: true },
    vendedores: { label: 'Vendedores', fields: [['nombre', 'Nombre', 'text', true], ['telefono', 'Teléfono'], ['idSucursal', 'Sucursal', 'select:sucursales', true]], columns: [['nombre', 'Nombre'], ['telefono', 'Teléfono'], ['sucursal', 'Sucursal']] },
    monedas: { label: 'Monedas', fields: [['codigo', 'Código', 'text', true], ['nombre', 'Nombre', 'text', true], ['simbolo', 'Símbolo', 'text', true], ['activo', 'Activo', 'checkbox']], canDisable: true },
    'tipos-pos': { label: 'Tipos de POS', fields: [['nombre', 'Nombre', 'text', true], ['activo', 'Activo', 'checkbox']], canDisable: true },
};
const normalizeRows = rows => (rows || []).map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key.charAt(0).toLowerCase() + key.slice(1), value])));

export default function DatosMaestrosPage() {
    const { updateSucursalLocal, isAdministrator } = useAuth();
    const [entity, setEntity] = useState('sucursales'); const [rows, setRows] = useState([]); const [query, setQuery] = useState(''); const [editing, setEditing] = useState(null); const [form, setForm] = useState(null); const [options, setOptions] = useState({}); const [notification, setNotification] = useState(null);
    const config = catalogs[entity];
    const columns = useMemo(() => config.columns || config.fields.filter(field => !field[0].startsWith('id')).map(field => [field[0], field[1]]), [config]);
    const load = useCallback(async () => { try { const response = await axiosClient.get(`/datos-maestros/${entity}`, { params: { query } }); setRows(normalizeRows(response.data.data)); } catch (error) { setNotification({ type: 'error', message: error.response?.data?.message || 'No fue posible cargar los datos.' }); } }, [entity, query]);
    const loadOptions = useCallback(async () => { try { const entries = await Promise.all(['sucursales', 'proveedores', 'productos'].map(async key => [key, normalizeRows((await axiosClient.get(`/datos-maestros/${key}`)).data.data)])); setOptions(Object.fromEntries(entries)); } catch { /* La tabla principal mostrará el error si el servicio no está disponible. */ } }, []);
    useEffect(() => { const timer = window.setTimeout(load, 250); return () => window.clearTimeout(timer); }, [load]);
    useEffect(() => { loadOptions(); }, [loadOptions]);

    const open = (row = null) => { const values = {}; config.fields.forEach(([key, , type]) => { values[key] = row?.[key] ?? (type === 'checkbox' ? true : ''); }); setEditing(row); setForm(values); };
    const close = () => { setEditing(null); setForm(null); };
    const save = async () => {
        for (const [key, label, , required] of config.fields) if (required && (form[key] === '' || form[key] == null)) return setNotification({ type: 'warning', message: `${label} es obligatorio.` });
        try {
            const response = await axiosClient.post(`/datos-maestros/${entity}`, { id: editing?.id || null, datos: form });
            const savedId = editing?.id || response.data.data?.id;
            if (entity === 'sucursales') updateSucursalLocal(savedId, { nombreSuc: form.nombre, colorIdentificacion: form.colorIdentificacion });
            close(); await Promise.all([load(), loadOptions()]); setNotification({ type: 'success', message: 'Datos guardados.' });
        } catch (error) { setNotification({ type: 'error', message: error.response?.data?.errors || error.response?.data?.message || 'No fue posible guardar.' }); }
    };
    const disable = async row => { if (!window.confirm('¿Deseas desactivar este registro?')) return; try { await axiosClient.delete(`/datos-maestros/${entity}/${row.id}`); await load(); setNotification({ type: 'success', message: 'Registro desactivado.' }); } catch (error) { setNotification({ type: 'error', message: error.response?.data?.message || 'No fue posible desactivar.' }); } };

    if (!isAdministrator) return <section className="border bg-white p-6"><h1 className="text-xl font-bold">Datos maestros</h1></section>;
    return <div className="space-y-5">
        <NotificationToast notification={notification} onClose={() => setNotification(null)} />
        <header className="page-title p-5"><h1 className="text-2xl font-bold">Datos maestros</h1></header>
        <div className="grid gap-5 xl:grid-cols-[260px_1fr]">
            <aside className="h-fit border bg-white p-2">{Object.entries(catalogs).map(([key, item]) => <button key={key} onClick={() => { setEntity(key); setQuery(''); }} className={`w-full border-l-4 px-3 py-3 text-left text-sm ${entity === key ? 'border-brand-teal bg-teal-50 font-bold text-brand-teal' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>{item.label}</button>)}</aside>
            <section className="min-w-0 border bg-white">
                <div className="border-b p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">{config.label}</h2><button onClick={() => open()} className="flex items-center gap-2 rounded-md bg-brand-teal px-4 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" />Nuevo</button></div><div className="relative mt-4"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input className="input pl-9" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar" /></div></div>
                <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead className="bg-slate-100 text-left"><tr>{columns.map(([key, label]) => <th key={key} className="px-4 py-3">{label}</th>)}<th className="px-4 py-3 text-right">Acciones</th></tr></thead><tbody className="divide-y">{rows.map(row => <tr key={`${entity}-${row.id}-${row.idProducto || ''}`}>{columns.map(([key]) => <td key={key} className="px-4 py-3">{formatCell(key, row[key])}</td>)}<td className="px-4 py-3"><div className="flex justify-end gap-1"><button onClick={() => open(row)} className="rounded-md p-2 hover:bg-slate-100" title="Editar"><Edit3 className="h-4 w-4" /></button>{config.canDisable && row.activo !== false && <button onClick={() => disable(row)} className="rounded-md p-2 text-red-600 hover:bg-red-50" title="Desactivar"><Power className="h-4 w-4" /></button>}</div></td></tr>)}</tbody></table></div>
                {!rows.length && <p className="p-8 text-center text-sm text-slate-500">No hay registros.</p>}
            </section>
        </div>
        {form && <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/35 p-4"><div className="w-full max-w-xl border bg-white shadow-xl"><header className="flex items-center justify-between border-b p-4"><h3 className="font-bold">{editing ? 'Editar' : 'Nuevo'} · {config.label}</h3><button onClick={close}><X className="h-5 w-5" /></button></header><div className="grid gap-4 p-5 sm:grid-cols-2">{config.fields.map(field => <Field key={field[0]} field={field} value={form[field[0]]} onChange={value => setForm({ ...form, [field[0]]: value })} options={options} />)}</div><footer className="flex justify-end gap-2 border-t p-4"><button onClick={close} className="rounded-md border px-4 py-2">Cancelar</button><button onClick={save} className="rounded-md bg-brand-teal px-4 py-2 font-bold text-white">Guardar</button></footer></div></div>}
    </div>;
}
function formatCell(key, value) { if (key === 'colorIdentificacion') return <span className="flex items-center gap-2"><i className="h-5 w-5 rounded-sm border" style={{ backgroundColor: value }} />{value}</span>; if (typeof value === 'boolean') return value ? 'Activo' : 'Inactivo'; return String(value ?? '—'); }
function Field({ field, value, onChange, options }) { const [, label, type = 'text', required] = field; if (type === 'color') return <label className="sm:col-span-2 text-sm font-semibold">{label}{required && ' *'}<div className="mt-2 flex flex-wrap gap-2">{palette.map(color => <button type="button" key={color} onClick={() => onChange(color)} className={`h-8 w-8 rounded-md border-2 ${value === color ? 'border-slate-900' : 'border-white shadow'}`} style={{ backgroundColor: color }} title={color} />)}<input type="color" value={value || palette[0]} onChange={event => onChange(event.target.value.toUpperCase())} className="h-8 w-10" /></div></label>; if (type.startsWith('select:')) { const source = type.split(':')[1]; return <label className="text-sm font-semibold">{label}{required && ' *'}<select className="input mt-1" value={value} onChange={event => onChange(Number(event.target.value))}><option value="">Seleccionar</option>{(options[source] || []).map(option => <option key={option.id} value={option.id}>{option.nombre || option.codigo}</option>)}</select></label>; } if (type === 'checkbox') return <label className="flex items-center gap-2 pt-7 text-sm font-semibold"><input type="checkbox" checked={Boolean(value)} onChange={event => onChange(event.target.checked)} />{label}</label>; return <label className="text-sm font-semibold">{label}{required && ' *'}<input type={type} step={type === 'number' ? '0.01' : undefined} className="input mt-1" value={value} onChange={event => onChange(event.target.value)} /></label>; }
