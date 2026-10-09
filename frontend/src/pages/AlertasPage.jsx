import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

export default function AlertasPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { try { const response = await axiosClient.get("/notificaciones/historial", { params: { limite: 150 } }); setRows(response.data.data || []); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const open = async (row) => { if (!row.leida) await axiosClient.post(`/notificaciones/${row.idNotificacion}/leer`); window.dispatchEvent(new Event("notifications-refresh")); await load(); if (row.url) navigate(row.url); };
  const readAll = async () => { await axiosClient.post("/notificaciones/leer-todas"); window.dispatchEvent(new Event("notifications-refresh")); await load(); };
  return <div className="mx-auto max-w-4xl space-y-5"><header className="page-title flex flex-wrap items-center justify-between gap-3 p-5"><div><h1 className="text-2xl font-bold">Notificaciones</h1><p className="mt-1 text-sm text-slate-500">Avisos personales, solicitudes y decisiones del sistema.</p></div><button onClick={readAll} className="button-secondary"><CheckCheck className="h-4 w-4" />Marcar pendientes como leídas</button></header><section className="overflow-hidden rounded-xl border bg-white shadow-sm">
    {rows.map((row) => <button key={row.idNotificacion} onClick={() => open(row)} className={`flex w-full items-start gap-4 border-b p-4 text-left last:border-b-0 hover:bg-slate-50 ${!row.leida && !row.resuelta ? "bg-sky-50/50" : ""}`}><span className={`mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full ${row.resuelta ? "bg-slate-100 text-slate-500" : "bg-slate-50 text-[var(--branch-color)]"}`}><Bell className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><b>{row.titulo}</b>{row.resuelta && <small className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">Resuelta</small>}{!row.leida && !row.resuelta && <small className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">Nueva</small>}</span><span className="mt-1 block text-sm text-slate-600">{row.mensaje}</span><small className="mt-2 block text-slate-400">{new Date(row.fechaCreacion).toLocaleString("es-GT")}</small></span>{row.url && <ChevronRight className="mt-2 h-5 w-5 shrink-0 text-slate-400" />}</button>)}
    {loading && <p className="p-10 text-center text-sm text-slate-500">Cargando notificaciones…</p>}{!loading && !rows.length && <div className="p-12 text-center"><Bell className="mx-auto h-8 w-8 text-[var(--branch-color)]"/><h2 className="mt-4 font-bold">Sin notificaciones</h2><p className="mt-1 text-sm text-slate-500">Los avisos importantes aparecerán aquí.</p></div>}
  </section></div>;
}
