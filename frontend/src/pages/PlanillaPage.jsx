import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CircleDollarSign, Pencil, Search, Settings2, UsersRound, X } from "lucide-react";
import axiosClient from "../api/axiosClient";
import NotificationToast from "../components/NotificationToast";
import { useAuth } from "../context/AuthContext";

const money = new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" });
const isoDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const currentMonth = () => {
  const now = new Date();
  return { fechaDesde: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), fechaHasta: isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)) };
};

export default function PlanillaPage() {
  const { selectedSucursalId, sucursales, isAdministrator } = useAuth();
  const [filters, setFilters] = useState(currentMonth);
  const [applied, setApplied] = useState(currentMonth);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configuration, setConfiguration] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const branch = sucursales.find((item) => String(item.idSucursal) === String(selectedSucursalId));

  const load = useCallback(async (range) => {
    if (!selectedSucursalId) return;
    setLoading(true);
    try {
      const response = await axiosClient.get("/trabajadores/planilla", { params: { idSucursal: selectedSucursalId, ...range } });
      setRows(response.data.data || []);
      setApplied(range);
    } catch (error) {
      setNotice({ type: "error", message: error.response?.data?.message || "No fue posible calcular la planilla." });
    } finally { setLoading(false); }
  }, [selectedSucursalId]);

  useEffect(() => {
    const range = currentMonth();
    setFilters(range);
    setConfiguration(null);
    load(range);
  }, [selectedSucursalId, load]);

  const totals = useMemo(() => rows.reduce((result, row) => ({
    salary: result.salary + Number(row.salarioBasePeriodo || 0),
    bonuses: result.bonuses + Number(row.totalBonos || 0),
    payable: result.payable + Number(row.totalPagar || 0),
  }), { salary: 0, bonuses: 0, payable: 0 }), [rows]);

  const consult = () => {
    if (!filters.fechaDesde || !filters.fechaHasta) return setNotice({ type: "warning", message: "Selecciona ambas fechas." });
    if (filters.fechaHasta < filters.fechaDesde) return setNotice({ type: "warning", message: "La fecha final no puede ser anterior a la fecha inicial." });
    load({ ...filters });
  };

  const useCurrentMonth = () => { const range = currentMonth(); setFilters(range); load(range); };

  const openConfiguration = async (worker) => {
    try {
      const response = await axiosClient.get(`/trabajadores/${worker.idVendedor}/configuracion-pago`);
      setConfiguration(response.data.data);
    } catch (error) {
      setNotice({ type: "error", message: error.response?.data?.message || "No fue posible cargar el sueldo del trabajador." });
    }
  };

  const toggleBonus = (idBono) => setConfiguration((current) => ({ ...current, bonos: current.bonos.map((bonus) => bonus.idBono === idBono ? { ...bonus, asignado: !bonus.asignado } : bonus) }));

  const saveConfiguration = async () => {
    if (Number(configuration.salarioMensual) <= 0) return setNotice({ type: "warning", message: "El sueldo mensual debe ser mayor que cero." });
    setSaving(true);
    try {
      await axiosClient.put("/trabajadores/configuracion-pago", {
        idVendedor: configuration.idVendedor,
        salarioMensual: Number(configuration.salarioMensual),
        bonos: configuration.bonos.filter((bonus) => bonus.asignado).map((bonus) => bonus.idBono),
      });
      setConfiguration(null);
      await load(applied);
      setNotice({ type: "success", message: "Sueldo y bonos actualizados." });
    } catch (error) {
      setNotice({ type: "error", message: error.response?.data?.message || "No fue posible guardar la configuración de pago." });
    } finally { setSaving(false); }
  };

  return <div className="space-y-5">
    <NotificationToast notification={notice} onClose={() => setNotice(null)} />
    <header className="page-title p-5 sm:p-6"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--branch-color)]">{branch?.nombreSuc || "Sucursal"}</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Planilla de trabajadores</h1><p className="mt-1 text-sm text-slate-500">Calcula el sueldo base y los beneficios según las ventas del período.</p></div><div className="border-l-4 border-[var(--branch-color)] bg-slate-50 px-4 py-3 text-sm"><b>{formatPeriod(applied)}</b><span className="mt-1 block text-xs text-slate-500">Divisor salarial: 30 días</span></div></div></header>

    <section className="border bg-white p-5"><div className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto]"><DateField label="Desde" value={filters.fechaDesde} onChange={(value) => setFilters({ ...filters, fechaDesde: value })} /><DateField label="Hasta" value={filters.fechaHasta} onChange={(value) => setFilters({ ...filters, fechaHasta: value })} /><button onClick={consult} className="button-primary self-end"><Search className="h-4 w-4" />Consultar</button><button onClick={useCurrentMonth} className="button-secondary self-end"><CalendarDays className="h-4 w-4" />Mes actual</button></div><p className="mt-3 text-xs text-slate-500">Puedes elegir uno o varios días. Un mes completo paga el sueldo mensual; un rango personalizado se calcula como sueldo mensual ÷ 30 × días seleccionados.</p></section>

    <section className="grid gap-4 sm:grid-cols-3">
      <Metric icon={UsersRound} label="Trabajadores" value={rows.length} />
      <Metric icon={CircleDollarSign} label="Sueldos base" value={money.format(totals.salary)} />
      <Metric icon={Settings2} label="Bonos / Total a pagar" value={`${money.format(totals.bonuses)} / ${money.format(totals.payable)}`} />
    </section>

    <section className="overflow-hidden border bg-white">
      <div className="overflow-x-auto"><table className="w-full min-w-[1120px] text-sm"><thead className="bg-slate-100 text-left text-slate-700"><tr><th className="px-4 py-3">Trabajador</th><th className="px-4 py-3">Sucursal</th><th className="px-4 py-3 text-right">Sueldo mensual</th><th className="px-4 py-3 text-center">Días</th><th className="px-4 py-3 text-right">Sueldo del período</th><th className="px-4 py-3 text-center">Ventas</th><th className="px-4 py-3 text-right">Total vendido</th><th className="px-4 py-3">Bonos aplicados</th><th className="px-4 py-3 text-right">Total a pagar</th>{isAdministrator && <th className="px-4 py-3 text-center">Configurar</th>}</tr></thead><tbody className="divide-y">{rows.map((row) => <tr key={row.idVendedor} className="hover:bg-slate-50"><td className="px-4 py-4"><b className="text-slate-900">{row.trabajador}</b><span className="block text-xs text-slate-500">{row.puesto || "Trabajador"}</span></td><td className="px-4 py-4">{row.sucursal || "—"}</td><td className="px-4 py-4 text-right">{money.format(row.salarioMensual)}</td><td className="px-4 py-4 text-center font-semibold">{row.diasPago}</td><td className="px-4 py-4 text-right">{money.format(row.salarioBasePeriodo)}</td><td className="px-4 py-4 text-center">{row.ventas}</td><td className="px-4 py-4 text-right">{money.format(row.totalVendido)}</td><td className="max-w-[260px] px-4 py-4"><b className="text-emerald-700">{money.format(row.totalBonos)}</b><span className="mt-1 block text-xs leading-5 text-slate-500">{row.bonosDetalle || "Sin bonos asignados"}</span></td><td className="px-4 py-4 text-right text-base font-bold text-slate-900">{money.format(row.totalPagar)}</td>{isAdministrator && <td className="px-4 py-4 text-center"><button onClick={() => openConfiguration(row)} className="rounded-full border p-2 text-slate-600 hover:border-[var(--branch-color)] hover:text-[var(--branch-color)]" title="Configurar sueldo y bonos"><Pencil className="h-4 w-4" /></button></td>}</tr>)}</tbody></table></div>
      {loading && <p className="p-10 text-center text-sm text-slate-500">Calculando planilla…</p>}
      {!loading && !rows.length && <p className="p-10 text-center text-sm text-slate-500">No hay trabajadores activos para esta sucursal.</p>}
      {!!rows.length && <footer className="flex flex-wrap items-center justify-end gap-8 border-t bg-slate-50 px-5 py-4 text-sm"><span>Bonos: <b className="text-emerald-700">{money.format(totals.bonuses)}</b></span><span>Total de planilla: <b className="text-lg text-slate-900">{money.format(totals.payable)}</b></span></footer>}
    </section>

    {configuration && <SalaryModal configuration={configuration} setConfiguration={setConfiguration} toggleBonus={toggleBonus} close={() => setConfiguration(null)} save={saveConfiguration} saving={saving} />}
  </div>;
}

function DateField({ label, value, onChange }) { return <label className="text-sm font-semibold text-slate-700">{label}<input type="date" className="input mt-1" value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function Metric({ icon: Icon, label, value }) { return <article className="border bg-white p-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-[var(--branch-color)]"><Icon className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><b className="text-lg text-slate-900">{value}</b></div></div></article>; }

function SalaryModal({ configuration, setConfiguration, toggleBonus, close, save, saving }) {
  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/40 p-4"><div className="my-6 w-full max-w-2xl border bg-white shadow-2xl"><header className="flex items-start justify-between border-b p-5"><div><p className="text-xs font-bold uppercase tracking-wide text-[var(--branch-color)]">Configuración de pago</p><h2 className="mt-1 text-xl font-bold">{configuration.trabajador}</h2><p className="text-sm text-slate-500">{configuration.puesto || "Trabajador"} · {configuration.sucursal || "Sin sucursal"}</p></div><button onClick={close} className="rounded-full p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></header><div className="space-y-5 p-5"><label className="block text-sm font-semibold">Sueldo mensual (Q)<input type="number" min="0.01" step="0.01" className="input mt-1" value={configuration.salarioMensual} onChange={(event) => setConfiguration({ ...configuration, salarioMensual: event.target.value })} /></label><div><div className="mb-3"><h3 className="font-bold text-slate-900">Bonos disponibles</h3><p className="text-sm text-slate-500">Activa únicamente los beneficios que aplican a este trabajador.</p></div><div className="space-y-2">{configuration.bonos.map((bonus) => <label key={bonus.idBono} className={`flex cursor-pointer gap-3 border p-4 transition ${bonus.asignado ? "border-[var(--branch-color)] bg-slate-50" : "hover:bg-slate-50"}`}><input type="checkbox" className="mt-1 h-4 w-4" checked={bonus.asignado} onChange={() => toggleBonus(bonus.idBono)} /><span className="min-w-0"><b className="block text-slate-900">{bonus.nombre}</b><span className="block text-sm text-slate-600">{describeBonus(bonus)}</span>{bonus.descripcion && <span className="mt-1 block text-xs text-slate-500">{bonus.descripcion}</span>}</span></label>)}{!configuration.bonos.length && <p className="border border-dashed p-5 text-center text-sm text-slate-500">No hay bonos activos. Puedes crearlos en Configuración → Datos maestros → Bonos de planilla.</p>}</div></div></div><footer className="flex justify-end gap-2 border-t p-4"><button onClick={close} className="button-secondary">Cancelar</button><button disabled={saving} onClick={save} className="button-primary disabled:opacity-50">{saving ? "Guardando…" : "Guardar configuración"}</button></footer></div></div>;
}

function describeBonus(bonus) {
  if (bonus.tipoCalculo === "PORCENTAJE_VENTAS") return `${Number(bonus.porcentaje)}% del total vendido en el período.`;
  if (bonus.tipoCalculo === "META_MONTO_VENTAS") return `${money.format(bonus.montoBono)} al vender al menos ${money.format(bonus.metaMinima)}.`;
  if (bonus.tipoCalculo === "META_CANTIDAD_VENTAS") return `${money.format(bonus.montoBono)} al completar al menos ${Number(bonus.metaMinima)} ventas.`;
  return `${money.format(bonus.montoBono)} fijos en el período.`;
}

function formatPeriod(range) {
  const format = (value) => value ? value.split("-").reverse().join("/") : "—";
  return `${format(range.fechaDesde)} al ${format(range.fechaHasta)}`;
}
