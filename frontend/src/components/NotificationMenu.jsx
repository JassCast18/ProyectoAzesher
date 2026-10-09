import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

const formatDate = (value) => new Date(value).toLocaleString("es-GT", {
  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
});

export default function NotificationMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const load = useCallback(async () => {
    try {
      const response = await axiosClient.get("/notificaciones", { params: { limite: 8 } });
      setItems(response.data.data?.registros || []);
      setUnread(response.data.data?.noLeidas || 0);
    } catch { /* El sondeo no debe interrumpir el trabajo. */ }
  }, []);
  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15000);
    window.addEventListener("notifications-refresh", load);
    return () => { window.clearInterval(timer); window.removeEventListener("notifications-refresh", load); };
  }, [load]);
  const openItem = async (item) => {
    await axiosClient.post(`/notificaciones/${item.idNotificacion}/leer`);
    setOpen(false); await load();
    if (item.url) navigate(item.url);
  };
  const readAll = async () => { await axiosClient.post("/notificaciones/leer-todas"); await load(); };
  return <div className="relative">
    <button type="button" onClick={() => { setOpen((value) => !value); if (!open) load(); }} className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-[var(--branch-color)]" aria-label="Notificaciones">
      <Bell className="h-5 w-5" />
      {unread > 0 && <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>}
    </button>
    {open && <><button aria-label="Cerrar notificaciones" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} /><section className="fixed inset-x-3 top-16 z-50 max-h-[70vh] overflow-hidden rounded-xl border bg-white shadow-2xl sm:absolute sm:inset-auto sm:right-0 sm:top-12 sm:w-96">
      <header className="flex items-center justify-between border-b p-4"><div><h2 className="font-bold text-slate-900">Notificaciones</h2><p className="text-xs text-slate-500">{unread} pendientes</p></div>{unread > 0 && <button onClick={readAll} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--branch-color)]"><CheckCheck className="h-4 w-4" />Marcar todas</button>}</header>
      <div className="max-h-[52vh] overflow-y-auto divide-y">{items.map((item) => <button key={item.idNotificacion} onClick={() => openItem(item)} className="flex w-full items-start gap-3 p-4 text-left hover:bg-slate-50"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--branch-color)]" /><span className="min-w-0 flex-1"><b className="block text-sm text-slate-900">{item.titulo}</b><span className="mt-1 block text-xs leading-5 text-slate-600">{item.mensaje}</span><small className="mt-1 block text-slate-400">{formatDate(item.fechaCreacion)}</small></span>{item.url && <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />}</button>)}{!items.length && <p className="p-8 text-center text-sm text-slate-500">No tienes notificaciones pendientes.</p>}</div>
      <button onClick={() => { setOpen(false); navigate("/alertas"); }} className="w-full border-t p-3 text-sm font-semibold text-[var(--branch-color)]">Ver historial</button>
    </section></>}
  </div>;
}
