import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import logo from "../assets/logo.png";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const save = async (event) => {
    event.preventDefault();
    if (password.length < 8)
      return setMessage("La contraseña debe tener al menos 8 caracteres.");
    if (password !== confirmation)
      return setMessage("Las contraseñas no coinciden.");
    try {
      const response = await axiosClient.post("/auth/reset-password", {
        token: params.get("token") || "",
        password,
      });
      setMessage(response.data.message);
      setDone(true);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "No fue posible cambiar la contraseña.",
      );
    }
  };
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <section className="w-full max-w-md border bg-white p-8 shadow-lg">
        <img src={logo} alt="Aze-Sher's" className="mx-auto mb-5 w-36" />
        <h1 className="text-2xl font-bold">Nueva contraseña</h1>
        <p className="mt-2 text-sm text-slate-500">
          El enlace sólo puede utilizarse una vez.
        </p>
        {!done && (
          <form onSubmit={save} className="mt-6 space-y-4">
            <input
              type="password"
              className="input"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              className="input"
              placeholder="Confirmar contraseña"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
            <button className="button-primary w-full">
              Guardar contraseña
            </button>
          </form>
        )}
        {message && (
          <p
            className={`mt-4 text-sm ${done ? "text-emerald-700" : "text-red-600"}`}
          >
            {message}
          </p>
        )}
        {done && (
          <Link
            to="/"
            className="mt-5 block text-center font-semibold text-brand-teal"
          >
            Iniciar sesión
          </Link>
        )}
      </section>
    </main>
  );
}
