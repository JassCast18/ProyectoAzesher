import { useEffect, useState } from "react";
import { KeyRound, MailCheck, Save, UserRound } from "lucide-react";
import axiosClient from "../api/axiosClient";
import NotificationToast from "../components/NotificationToast";
import { useAuth } from "../context/AuthContext";
import { isStrongPassword, passwordHint } from "../utils/passwordPolicy";
import { useSearchParams } from "react-router-dom";

const emptyPassword = { passwordActual: "", passwordNueva: "", confirmacion: "", codigoCorreo: "" };

export default function ProfilePage() {
  const { isAdministrator, updateToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [password, setPassword] = useState(emptyPassword);
  const [tab, setTab] = useState(() => searchParams.get("seccion") === "password" ? "password" : "datos");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [codeSent, setCodeSent] = useState({});

  useEffect(() => {
    axiosClient.get("/perfil").then((response) => { setProfile(response.data.data); setRegisteredEmail(response.data.data.correo); })
      .catch(() => setNotice({ type: "error", message: "No fue posible cargar tu perfil." }));
  }, []);
  useEffect(() => { setTab(searchParams.get("seccion") === "password" ? "password" : "datos"); }, [searchParams]);

  const requestCode = async (proposito) => {
    try {
      setBusy(true);
      const response = await axiosClient.post("/perfil/verificacion", {
        proposito,
      });
      setCodeSent((current) => ({ ...current, [proposito]: true }));
      setNotice({ type: "success", message: response.data.message });
    } catch (error) {
      setNotice({ type: "error", message: error.response?.data?.message || "No se pudo enviar el código." });
    } finally { setBusy(false); }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!isAdministrator && !profile.codigoCorreo?.trim())
      return setNotice({ type: "warning", message: "Solicita e ingresa el código enviado a tu correo." });
    try {
      setBusy(true);
      const response = await axiosClient.put("/perfil", profile);
      setProfile(response.data.data.perfil);
      setRegisteredEmail(response.data.data.perfil.correo);
      updateToken(response.data.data.token);
      setCodeSent((current) => ({ ...current, perfil: false }));
      setNotice({ type: "success", message: "Tu perfil se actualizó correctamente." });
    } catch (error) {
      setNotice({ type: "error", message: error.response?.data?.message || "No se pudo guardar el perfil." });
    } finally { setBusy(false); }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (!isStrongPassword(password.passwordNueva))
      return setNotice({ type: "warning", message: passwordHint });
    if (password.passwordNueva !== password.confirmacion)
      return setNotice({ type: "warning", message: "La confirmación no coincide." });
    if (!isAdministrator && !password.codigoCorreo.trim())
      return setNotice({ type: "warning", message: "Ingresa el código enviado a tu correo." });
    try {
      setBusy(true);
      await axiosClient.post("/perfil/password", password);
      setPassword(emptyPassword);
      setCodeSent((current) => ({ ...current, password: false }));
      setNotice({ type: "success", message: "Contraseña actualizada. Usa la nueva clave en tu próximo inicio de sesión." });
    } catch (error) {
      setNotice({ type: "error", message: error.response?.data?.message || "No se pudo cambiar la contraseña." });
    } finally { setBusy(false); }
  };

  const setField = (field, value) => setProfile((current) => ({ ...current, [field]: value }));
  const setPass = (field, value) => setPassword((current) => ({ ...current, [field]: value }));

  return <div className="mx-auto max-w-3xl space-y-5">
    <NotificationToast notification={notice} onClose={() => setNotice(null)} />
    <div className="border-b border-slate-200 pb-4">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--branch-color)]">Mi cuenta</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Perfil y seguridad</h1>
      <p className="mt-1 text-sm text-slate-500">Actualiza tus datos y protege tu acceso al sistema.</p>
    </div>
    <div className="flex gap-2 overflow-x-auto border-b border-slate-200">
      <button className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm ${tab === "datos" ? "border-b-2 border-[var(--branch-color)] font-semibold" : "text-slate-500"}`} onClick={() => setSearchParams({ seccion: "datos" }, { replace: true })}><UserRound className="h-4 w-4" /> Mi información</button>
      <button className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm ${tab === "password" ? "border-b-2 border-[var(--branch-color)] font-semibold" : "text-slate-500"}`} onClick={() => setSearchParams({ seccion: "password" }, { replace: true })}><KeyRound className="h-4 w-4" /> Cambiar contraseña</button>
    </div>
    {tab === "datos" ? <form onSubmit={saveProfile} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {!profile ? <p className="text-slate-500">Cargando perfil…</p> : <>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombres" value={profile.nombre} onChange={(value) => setField("nombre", value)} required />
          <Input label="Apellidos" value={profile.apellidos} onChange={(value) => setField("apellidos", value)} required />
          <Input label="Usuario" value={profile.username} onChange={(value) => setField("username", value)} required />
          <Input label="Teléfono" value={profile.telefono} onChange={(value) => setField("telefono", value.replace(/\D/g, ""))} maxLength={8} inputMode="numeric" />
          <div className="sm:col-span-2"><Input label="Correo electrónico" type="email" value={profile.correo} onChange={(value) => { setField("correo", value); setCodeSent((current) => ({ ...current, perfil: false })); }} required /></div>
        </div>
        {!isAdministrator && <div className="rounded-lg bg-slate-50 p-4">
          <p className="mb-3 text-sm text-slate-600">Para guardar, confirma tu identidad con un código enviado al correo registrado: {registeredEmail}.</p>
          <div className="flex flex-wrap gap-2"><button type="button" className="button-secondary" disabled={busy} onClick={() => requestCode("perfil")}><MailCheck className="h-4 w-4" /> {codeSent.perfil ? "Reenviar código" : "Enviar código"}</button><input className="input max-w-40" aria-label="Código de correo" placeholder="Código de 8 dígitos" inputMode="numeric" maxLength={8} value={profile.codigoCorreo || ""} onChange={(event) => setField("codigoCorreo", event.target.value.replace(/\D/g, ""))} /></div>
        </div>}
        <button className="button-primary" disabled={busy}><Save className="h-4 w-4" /> Guardar mi perfil</button>
      </>}
    </form> : <form onSubmit={changePassword} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate-600">No puedes reutilizar tu contraseña actual ni las dos anteriores.</p>
      <Input label="Contraseña actual" type="password" value={password.passwordActual} onChange={(value) => setPass("passwordActual", value)} required autoComplete="current-password" />
      <Input label="Nueva contraseña" type="password" value={password.passwordNueva} onChange={(value) => setPass("passwordNueva", value)} required autoComplete="new-password" />
      <Input label="Confirma la nueva contraseña" type="password" value={password.confirmacion} onChange={(value) => setPass("confirmacion", value)} required autoComplete="new-password" />
      <p className="text-xs text-slate-500">{passwordHint}</p>
      {!isAdministrator && <div className="rounded-lg bg-slate-50 p-4"><p className="mb-3 text-sm text-slate-600">Enviaremos un código al correo registrado: {profile?.correo || "—"}.</p><div className="flex flex-wrap gap-2"><button type="button" className="button-secondary" disabled={busy} onClick={() => requestCode("password")}><MailCheck className="h-4 w-4" /> {codeSent.password ? "Reenviar código" : "Enviar código"}</button><input className="input max-w-40" aria-label="Código de correo" placeholder="Código de 8 dígitos" inputMode="numeric" maxLength={8} value={password.codigoCorreo} onChange={(event) => setPass("codigoCorreo", event.target.value.replace(/\D/g, ""))} /></div></div>}
      <button className="button-primary" disabled={busy}><KeyRound className="h-4 w-4" /> Cambiar contraseña</button>
    </form>}
  </div>;
}

function Input({ label, value, onChange, type = "text", ...props }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<input className="input mt-1 w-full" type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} {...props} /></label>;
}
