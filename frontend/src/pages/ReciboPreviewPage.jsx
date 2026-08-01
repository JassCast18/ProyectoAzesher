import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BadgeCheck, CircleAlert, Printer, Sparkles, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import logoAzeShers from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import { buildReceiptPdfPayload } from '../middleware/ventasValidations';

const money = new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
});

export default function ReciboPreviewPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const receiptDraft = location.state?.receiptDraft;

    const [pdfUrl, setPdfUrl] = useState('');
    const [pdfVersion, setPdfVersion] = useState(0);
    const [savedReceipt, setSavedReceipt] = useState(null);
    const [message, setMessage] = useState('');
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [isAuthorizing, setIsAuthorizing] = useState(false);

    const sellerName = useMemo(() => receiptDraft?.vendedor || user?.unique_name || user?.nombre || 'Usuario', [receiptDraft, user]);

    useEffect(() => {
        if (!receiptDraft) {
            navigate('/ventas', { replace: true });
            return;
        }

        let isActive = true;
        let objectUrl = '';

        const loadPreview = async () => {
            setIsLoadingPreview(true);
            setMessage('');

            try {
                const payload = buildReceiptPdfPayload({ receipt: receiptDraft });
                const response = await axiosClient.post('/ventas/recibos/pdf-temporal', payload, {
                    responseType: 'blob',
                });

                objectUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                if (isActive) {
                    setPdfUrl(objectUrl);
                    setPdfVersion((currentVersion) => currentVersion + 1);
                }
            } catch {
                if (isActive) {
                    setMessage('No fue posible generar la vista previa del recibo.');
                }
            } finally {
                if (isActive) {
                    setIsLoadingPreview(false);
                }
            }
        };

        loadPreview();

        return () => {
            isActive = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [navigate, receiptDraft]);

    const refreshSavedPdf = async (idRecibo) => {
        setIsLoadingPreview(true);
        const response = await axiosClient.get(`/ventas/recibos/${idRecibo}/pdf`, {
            responseType: 'blob',
        });

        const savedPdfUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        setPdfUrl((currentUrl) => {
            if (currentUrl) {
                URL.revokeObjectURL(currentUrl);
            }
            return savedPdfUrl;
        });
        setPdfVersion((currentVersion) => currentVersion + 1);
        setIsLoadingPreview(false);
    };

    const handleAuthorizeReceipt = async () => {
        if (isAuthorizing) {
            return;
        }

        setIsAuthorizing(true);
        setMessage('');

        try {
            let targetReceipt = savedReceipt;

            if (!targetReceipt?.idRecibo) {
                const response = await axiosClient.post('/ventas/recibos', buildReceiptPdfPayload({ receipt: receiptDraft }));
                targetReceipt = response.data?.data ?? response.data?.Data ?? null;
                setSavedReceipt(targetReceipt);
            }

            if (targetReceipt?.idRecibo) {
                setMessage('Recibo guardado. Recargando la vista con el número definitivo...');
                await refreshSavedPdf(targetReceipt.idRecibo);
                setMessage('Recibo autorizado y listo para impresión.');
            } else {
                setMessage('No se pudo autorizar el recibo porque no se generó su registro.');
            }
        } catch (error) {
            setMessage(error.response?.data?.message || 'No fue posible autorizar el recibo.');
        } finally {
            setIsAuthorizing(false);
        }
    };

    if (!receiptDraft) {
        return null;
    }

    const lineCount = receiptDraft.items?.length ?? 0;

    const handlePrintReceipt = () => {
        if (!pdfUrl) {
            setMessage('Primero genera o autoriza el PDF del recibo.');
            return;
        }

        window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="min-h-[calc(100vh-8rem)] rounded-[2rem] border border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(236,253,255,0.72)_45%,_rgba(240,249,255,0.88))] p-4 shadow-xl shadow-slate-200/70 sm:p-6">
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <section className="space-y-5">
                    <div className="overflow-hidden rounded-[1.8rem] border border-teal-100 bg-white shadow-lg shadow-teal-100/40">
                        <div className="flex flex-col gap-4 bg-gradient-to-r from-teal-900 via-teal-800 to-cyan-700 px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 p-2 shadow-inner shadow-black/10">
                                    <img src={logoAzeShers} alt="Logo Aze-Sher's" className="h-full w-full object-contain" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.35em] text-cyan-100">Vista previa de recibo</p>
                                    <h1 className="mt-1 text-2xl font-semibold text-white">Revisa si el recibo está correcto</h1>
                                    <p className="mt-1 max-w-2xl text-sm text-cyan-100">
                                        Antes de guardar o autorizar, confirma cliente, sucursal, productos y método de pago.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => navigate('/ventas')}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Regresar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAuthorizeReceipt}
                                    disabled={isAuthorizing || isLoadingPreview}
                                    className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <ShieldCheck className="h-4 w-4" />
                                    {isAuthorizing ? 'Autorizando...' : 'Autorizar Recibo'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePrintReceipt}
                                    disabled={!pdfUrl}
                                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-teal-900 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Printer className="h-4 w-4" />
                                    Imprimir recibo PDF
                                </button>
                            </div>
                        </div>

                        <div className="border-b border-teal-100 bg-teal-50/70 px-5 py-3 text-sm text-teal-950">
                            <span className="font-semibold text-teal-900">Recibo pendiente:</span> {receiptDraft.numeroRecibo || 'se asigna al guardar'}
                            {' · '}
                            <span className="font-semibold text-teal-900">Factura:</span> {receiptDraft.numeroFactura}
                        </div>

                        <div className="p-4 sm:p-5">
                            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-2 shadow-inner shadow-slate-200/40">
                                <div className="aspect-[8.3/11.7] overflow-hidden rounded-[1.1rem] bg-white shadow-sm">
                                    {isLoadingPreview || !pdfUrl ? (
                                        <div className="flex h-full items-center justify-center p-8 text-center text-slate-500">
                                            <div className="max-w-sm space-y-3">
                                                <Sparkles className="mx-auto h-10 w-10 text-teal-500" />
                                                <p className="text-lg font-semibold text-slate-900">Preparando la vista del recibo</p>
                                                <p className="text-sm text-slate-500">Estamos armando el comprobante para que lo revises antes de guardarlo.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <iframe key={pdfVersion} title="Vista previa del recibo" src={pdfUrl} className="h-full w-full" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <aside className="space-y-5">
                    <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/70">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-teal-700">Resumen</p>
                                <h2 className="mt-1 text-xl font-semibold text-slate-900">Pedido listo para revisión</h2>
                            </div>
                            <div className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                                {money.format(receiptDraft.total)}
                            </div>
                        </div>

                        <div className="mt-5 space-y-3 text-sm text-slate-600">
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Cliente</p>
                                <p className="mt-1 text-base font-semibold text-slate-900">{receiptDraft.cliente.nombre}</p>
                                <p>{receiptDraft.cliente.nit || 'CF'}</p>
                                <p>{receiptDraft.cliente.domicilio || 'Sin dirección'}</p>
                                <p>{receiptDraft.cliente.telefono || 'Sin teléfono'}</p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                                <div className="rounded-2xl border border-slate-200 p-4">
                                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Sucursal</p>
                                    <p className="mt-1 font-semibold text-slate-900">{receiptDraft.sucursalNombre || 'Sin sucursal'}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 p-4">
                                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Vendedor</p>
                                    <p className="mt-1 font-semibold text-slate-900">{sellerName}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 p-4">
                                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Método de pago</p>
                                    <p className="mt-1 font-semibold text-slate-900">{receiptDraft.metodoPago}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 p-4">
                                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Líneas</p>
                                    <p className="mt-1 font-semibold text-slate-900">{lineCount}</p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-900">
                                <div className="flex items-start gap-3">
                                    <CircleAlert className="mt-0.5 h-5 w-5 flex-none" />
                                    <div>
                                        <p className="font-semibold">Confirma antes de autorizar</p>
                                        <p className="mt-1 text-sm text-amber-800">
                                            El número definitivo del recibo se asigna cuando lo guardas en la base de datos.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {savedReceipt?.numeroRecibo && (
                                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-900">
                                    <div className="flex items-start gap-3">
                                        <BadgeCheck className="mt-0.5 h-5 w-5 flex-none" />
                                        <div>
                                            <p className="font-semibold">Recibo guardado</p>
                                            <p className="mt-1 text-sm text-emerald-800">
                                                {savedReceipt.numeroRecibo} · {savedReceipt.numeroFactura}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {message && (
                                <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4 text-teal-900">
                                    {message}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-white/80 p-5 text-sm text-slate-600">
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                            <Printer className="h-4 w-4 text-teal-600" />
                            Siguiente paso
                        </div>
                        <p className="mt-2 leading-6">
                            Si el comprobante se ve bien, usa <span className="font-semibold text-slate-900">Autorizar Recibo</span> para guardar el recibo en la base y generar el número definitivo.
                            Después puedes usar <span className="font-semibold text-slate-900">Imprimir recibo PDF</span> para abrir la versión final.
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
