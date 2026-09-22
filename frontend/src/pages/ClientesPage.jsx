import { useCallback, useEffect, useMemo, useState } from "react";
import { Printer, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import NotificationToast from "../components/NotificationToast";

const money = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
});
const empty = { nombre: "", nit: "", telefono: "", correo: "", direccion: "", fechaNacimiento: "" };
const pageSize = 10;
const validPhone = (value) =>
  !value || /^(?:\+?502)?[2-7]\d{7}$/.test(value.replace(/[\s-]/g, ""));
const validNit = (value) => {
  const nit = value.replace(/[\s-]/g, "").toUpperCase();
  if (!nit || nit === "CF") return true;
  if (!/^\d+[0-9K]$/.test(nit)) return false;
  const body = nit.slice(0, -1);
  let sum = 0;
  for (let index = 0; index < body.length; index += 1)
    sum += Number(body[index]) * (body.length + 1 - index);
  const result = (11 - (sum % 11)) % 11;
  return nit.at(-1) === (result === 10 ? "K" : String(result));
};

export default function ClientesPage({ mode = "list" }) {
  const { selectedSucursalId } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [clients, setClients] = useState([]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [form, setForm] = useState(empty);
  const [confirm, setConfirm] = useState(false);
  const [recent, setRecent] = useState([]);
  const [notification, setNotification] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = useCallback(
    async (term = "") => {
      if (!selectedSucursalId) return [];
      const response = await axiosClient.get("/operaciones/clientes", {
        params: { query: term, idSucursal: selectedSucursalId },
      });
      const rows = response.data.data || [];
      setClients(rows);
      setPage(1);
      return rows;
    },
    [selectedSucursalId],
  );
  useEffect(() => {
    if (mode !== "create") load();
  }, [load, mode]);
  useEffect(() => {
    if (mode === "create") return undefined;
    const timer = window.setTimeout(() => load(query), 300);
    return () => window.clearTimeout(timer);
  }, [query, load, mode]);

  const pages = Math.max(1, Math.ceil(clients.length / pageSize));
  const visible = useMemo(
    () => clients.slice((page - 1) * pageSize, page * pageSize),
    [clients, page],
  );
  const validate = () => {
    if (!form.nombre.trim()) return "El nombre es obligatorio.";
    if (!validPhone(form.telefono))
      return "El teléfono debe tener 8 dígitos de Guatemala y comenzar entre 2 y 7.";
    if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
      return "El correo electrónico no es válido.";
    if (!validNit(form.nit)) return "El NIT no supera la validación local.";
    return "";
  };
  const requestSave = (event) => {
    event.preventDefault();
    const error = validate();
    if (error) setNotification({ type: "warning", message: error });
    else setConfirm(true);
  };
  const save = async () => {
    try {
      const response = await axiosClient.post("/operaciones/clientes", form);
      setRecent((current) =>
        [
          {
            ...form,
            idCliente: response.data.data?.idCliente,
            fechaRegistro: new Date(),
          },
          ...current,
        ].slice(0, 5),
      );
      setConfirm(false);
      setForm(empty);
      setNotification({
        type: "success",
        message: "Cliente creado correctamente.",
      });
    } catch (error) {
      setNotification({
        type: "error",
        message:
          error.response?.data?.message || "No fue posible crear el cliente.",
      });
    }
  };
  const viewHistory = async (client) => {
    setSelected(client);
    setHistoryLoading(true);
    try {
      const response = await axiosClient.get(
        `/operaciones/clientes/${client.idCliente}/historial`,
        { params: { idSucursal: selectedSucursalId } },
      );
      setHistory(
        (response.data.data || []).filter(
          (row) => row.estadoFactura === "Autorizada",
        ),
      );
    } catch (error) {
      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "No fue posible consultar el historial.",
      });
    } finally {
      setHistoryLoading(false);
    }
  };
  const updateClient = async () => {
    const error = (() => {
      if (!editing.nombre.trim()) return "El nombre es obligatorio.";
      if (!validPhone(editing.telefono))
        return "El teléfono debe tener 8 dígitos de Guatemala y comenzar entre 2 y 7.";
      if (editing.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editing.correo))
        return "El correo electrónico no es válido.";
      if (!validNit(editing.nit || ""))
        return "El NIT no supera la validación local.";
      return "";
    })();
    if (error) return setNotification({ type: "warning", message: error });
    try {
      await axiosClient.put(
        `/operaciones/clientes/${editing.idCliente}`,
        editing,
      );
      setEditing(null);
      await load(query);
      setNotification({
        type: "success",
        message: "Cliente actualizado correctamente.",
      });
    } catch (errorResponse) {
      setNotification({
        type: "error",
        message:
          errorResponse.response?.data?.message ||
          "No fue posible actualizar el cliente.",
      });
    }
  };

  if (mode === "create")
    return (
      <Page title="Nuevo cliente">
        <NotificationToast
          notification={notification}
          onClose={() => setNotification(null)}
        />
        <form
          onSubmit={requestSave}
          className="grid gap-4 border bg-white p-6 md:grid-cols-2"
        >
          <Input
            required
            label="Nombre o razón social *"
            value={form.nombre}
            set={(value) => setForm({ ...form, nombre: value })}
          />
          <Input
            label="NIT"
            value={form.nit}
            set={(value) => setForm({ ...form, nit: value.toUpperCase() })}
            hint="Validación local del dígito verificador."
          />
          <Input
            label="Teléfono"
            inputMode="numeric"
            value={form.telefono}
            set={(value) =>
              setForm({ ...form, telefono: value.replace(/[^\d+ -]/g, "") })
            }
            hint="8 dígitos; puede incluir +502."
          />
          <Input
            label="Correo"
            type="email"
            value={form.correo}
            set={(value) => setForm({ ...form, correo: value })}
          />
          <Input
            label="Dirección"
            value={form.direccion}
            set={(value) => setForm({ ...form, direccion: value })}
          />
          <Input label="Fecha de nacimiento" type="date" max={new Date().toISOString().slice(0,10)} value={form.fechaNacimiento} set={(value) => setForm({ ...form, fechaNacimiento: value })} />
          <button className="bg-brand-teal py-3 font-bold text-white md:col-start-2">
            Revisar y guardar
          </button>
        </form>
        <RecentTable rows={recent} />
        {confirm && (
          <Confirm data={form} cancel={() => setConfirm(false)} accept={save} />
        )}
      </Page>
    );

  return (
    <Page title="Clientes">
      <NotificationToast
        notification={notification}
        onClose={() => setNotification(null)}
      />
      <section className="border bg-white">
        <div className="relative border-b p-4">
          <Search className="absolute left-7 top-7 h-4 w-4 text-slate-400" />
          <input
            className="input pl-10"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nombre, NIT o teléfono"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-4">Cliente</th>
                <th>NIT</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Edad</th>
                <th className="text-right">Compras</th>
                <th className="text-right">Total comprado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.map((client) => (
                <tr
                  key={client.idCliente}
                  className={
                    selected?.idCliente === client.idCliente ? "bg-teal-50" : ""
                  }
                >
                  <td className="p-4 font-semibold">{client.nombre}</td>
                  <td>{client.nit || "CF"}</td>
                  <td>{client.telefono || "—"}</td>
                  <td>{client.correo || "—"}</td>
                  <td>{client.edad == null ? "—" : `${client.edad} años`}</td>
                  <td className="text-right">{client.compras}</td>
                  <td className="text-right font-semibold">
                    {money.format(client.totalComprado)}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      {client.tieneEstadoCrediticio && <button
                        onClick={() => navigate(`/cobros/estado-cuenta?idCliente=${client.idCliente}&cliente=${encodeURIComponent(client.nombre)}`)}
                        className="rounded-md border px-3 py-2 font-semibold"
                      >
                        Estado de cuenta
                      </button>}
                      <button
                        onClick={() => setEditing({ ...client })}
                        className="rounded-md border px-3 py-2 font-semibold"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => viewHistory(client)}
                        className="rounded-md bg-brand-teal px-3 py-2 font-semibold text-white"
                      >
                        Facturas
                      </button>
                      <button
                        onClick={() =>
                          navigate(
                            `/ventas/recibos?cliente=${encodeURIComponent(client.nombre)}`,
                          )
                        }
                        className="rounded-md border px-3 py-2 font-semibold"
                      >
                        Recibos
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!visible.length && (
          <p className="p-10 text-center text-sm text-slate-500">
            No se encontraron clientes.
          </p>
        )}
        <Pagination
          page={page}
          pages={pages}
          total={clients.length}
          setPage={setPage}
        />
      </section>
      {selected && (
        <HistoryTable
          client={selected}
          rows={history}
          loading={historyLoading}
        />
      )}
      {editing && (
        <EditClient
          data={editing}
          setData={setEditing}
          cancel={() => setEditing(null)}
          accept={updateClient}
        />
      )}
    </Page>
  );
}

function Page({ title, children }) {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="page-title p-5">
        <h1 className="text-2xl font-bold">{title}</h1>
      </header>
      {children}
    </div>
  );
}
function Input({ label, hint, value, set, ...props }) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <input
        {...props}
        className="input mt-1"
        value={value}
        onChange={(event) => set(event.target.value)}
      />
      {hint && (
        <small className="mt-1 block font-normal text-slate-500">{hint}</small>
      )}
    </label>
  );
}
function RecentTable({ rows }) {
  return (
    <section className="border bg-white">
      <h2 className="border-b p-4 font-bold">Últimos clientes creados</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-4">Cliente</th>
              <th>NIT</th>
              <th>Teléfono</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row, index) => (
              <tr key={row.idCliente || index}>
                <td className="p-4 font-semibold">{row.nombre}</td>
                <td>{row.nit || "CF"}</td>
                <td>{row.telefono || "—"}</td>
                <td>{new Date(row.fechaRegistro).toLocaleString("es-GT")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <p className="p-8 text-center text-sm text-slate-500">
          Todavía no has creado clientes en esta sesión.
        </p>
      )}
    </section>
  );
}
function HistoryTable({ client, rows, loading }) {
  const printInvoice = async (idFactura) => {
    const response = await axiosClient.get(`/facturacion/${idFactura}/pdf`, { responseType: "blob" });
    window.open(URL.createObjectURL(response.data), "_blank", "noopener,noreferrer");
  };
  return (
    <section className="border bg-white">
      <h2 className="border-b p-4 font-bold">Historial de {client.nombre}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-4">Fecha</th>
              <th>Recibo</th>
              <th>Factura</th>
              <th>Pago</th>
              <th className="text-right">Total</th>
              <th className="p-4 text-right">Pendiente</th>
              <th className="p-4 text-right">Factura</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.idVenta}>
                <td className="p-4">
                  {new Date(row.fecha).toLocaleString("es-GT")}
                </td>
                <td>{row.numeroRecibo || "—"}</td>
                <td>{row.numeroFactura || "—"}</td>
                <td className="capitalize">{row.tipoPago}</td>
                <td className="text-right font-semibold">
                  {money.format(row.total)}
                </td>
                <td className="p-4 text-right">
                  {money.format(row.saldoPendiente || 0)}
                </td>
                <td className="p-4 text-right">
                  <button disabled={!row.idFactura || !row.numeroFactura || String(row.numeroFactura).startsWith("BOR-")} onClick={() => printInvoice(row.idFactura)} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-35"><Printer className="h-4 w-4" />Imprimir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading && (
        <p className="p-8 text-center text-sm text-slate-500">
          Consultando historial…
        </p>
      )}
      {!loading && !rows.length && (
        <p className="p-8 text-center text-sm text-slate-500">
          Este cliente no tiene movimientos en esta sucursal.
        </p>
      )}
    </section>
  );
}
function Pagination({ page, pages, total, setPage }) {
  return (
    <footer className="flex items-center justify-between border-t bg-slate-50 px-4 py-3 text-sm">
      <span>{total} clientes</span>
      <div className="flex items-center gap-2">
        <button
          disabled={page === 1}
          onClick={() => setPage((value) => value - 1)}
          className="rounded-md border bg-white px-3 py-1.5 disabled:opacity-40"
        >
          Anterior
        </button>
        <span>
          Página {page} de {pages}
        </span>
        <button
          disabled={page === pages}
          onClick={() => setPage((value) => value + 1)}
          className="rounded-md border bg-white px-3 py-1.5 disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </footer>
  );
}
function Confirm({ data, cancel, accept }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <div className="w-full max-w-md border bg-white p-6 shadow-xl">
        <div className="flex justify-between">
          <h2 className="text-lg font-bold">Confirmar cliente</h2>
          <button onClick={cancel} aria-label="Cerrar">
            <X />
          </button>
        </div>
        <dl className="mt-5 space-y-2 text-sm">
          <Row label="Nombre" value={data.nombre} />
          <Row label="NIT" value={data.nit || "CF"} />
          <Row label="Teléfono" value={data.telefono || "Sin teléfono"} />
          <Row label="Dirección" value={data.direccion || "Sin dirección"} />
          <Row label="Nacimiento" value={data.fechaNacimiento ? new Date(`${data.fechaNacimiento.slice(0,10)}T12:00:00`).toLocaleDateString("es-GT") : "Sin registrar"} />
        </dl>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={cancel} className="rounded-md border px-4 py-2">
            Cancelar
          </button>
          <button
            onClick={accept}
            className="rounded-md bg-brand-teal px-4 py-2 font-bold text-white"
          >
            Guardar cliente
          </button>
        </div>
      </div>
    </div>
  );
}
function EditClient({ data, setData, cancel, accept }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <div className="w-full max-w-xl border bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Editar cliente</h2>
          <button onClick={cancel} aria-label="Cerrar">
            <X />
          </button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input
            required
            label="Nombre o razón social *"
            value={data.nombre || ""}
            set={(value) => setData({ ...data, nombre: value })}
          />
          <Input
            label="NIT"
            value={data.nit || ""}
            set={(value) => setData({ ...data, nit: value.toUpperCase() })}
          />
          <Input
            label="Teléfono"
            value={data.telefono || ""}
            set={(value) =>
              setData({ ...data, telefono: value.replace(/[^\d+ -]/g, "") })
            }
          />
          <Input
            label="Correo"
            type="email"
            value={data.correo || ""}
            set={(value) => setData({ ...data, correo: value })}
          />
          <div className="md:col-span-2">
            <Input
              label="Dirección"
              value={data.direccion || ""}
              set={(value) => setData({ ...data, direccion: value })}
            />
          </div>
          <Input label="Fecha de nacimiento" type="date" max={new Date().toISOString().slice(0,10)} value={data.fechaNacimiento?.slice?.(0,10) || ""} set={(value) => setData({ ...data, fechaNacimiento: value })} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={cancel} className="rounded-md border px-4 py-2">
            Cancelar
          </button>
          <button
            onClick={accept}
            className="rounded-md bg-brand-teal px-4 py-2 font-bold text-white"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
