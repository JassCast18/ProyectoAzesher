import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BadgeCheck, FileText, Printer, ShieldCheck, Table2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { buildReceiptPdfPayload } from '../middleware/ventasValidations';
import { clearSalesDraft } from '../state/ventasDraftStore';
import { useAuth } from '../context/AuthContext';
import NotificationToast from '../components/NotificationToast';

const money = new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
});

export default function ReciboPreviewPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const receiptDraft = location.state?.receiptDraft;
    const { setIsSucursalLocked } = useAuth();

    const [pdfUrl, setPdfUrl] = useState('');
    const [pdfVersion, setPdfVersion] = useState(0);
    const [savedReceipt, setSavedReceipt] = useState(null);
    const [notification, setNotification] = useState(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [isAuthorizing, setIsAuthorizing] = useState(false);

    const sellerName = useMemo(() => receiptDraft?.vendedor || 'Sin vendedor', [receiptDraft]);
    const isCredit = receiptDraft?.metodoPago === 'credito';
    const initialPayment = Number(receiptDraft?.paymentDetails?.credit?.initialAmount || 0);
    const pendingAmount = Math.max(0, Number(receiptDraft?.total || 0) - initialPayment);

    useEffect(() => {
        if (!receiptDraft) {
            navigate('/ventas', { replace: true });
            return;
        }

        let isActive = true;
        let objectUrl = '';

        const loadPreview = async () => {
            setIsLoadingPreview(true);
            setNotification(null);

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
                    setNotification({ message: 'No fue posible generar la vista previa del recibo.', type: 'error' });
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
        if (isAuthorizing || savedReceipt?.idRecibo) {
            return;
        }

        setIsAuthorizing(true);
        setNotification(null);

        try {
            let targetReceipt = savedReceipt;

            if (!targetReceipt?.idRecibo) {
                const response = await axiosClient.post('/ventas/recibos', buildReceiptPdfPayload({ receipt: receiptDraft }));
                targetReceipt = response.data?.data ?? response.data?.Data ?? null;
                setSavedReceipt(targetReceipt);
            }

            if (targetReceipt?.idRecibo) {
                clearSalesDraft();
                setIsSucursalLocked(false);
                setNotification({ message: 'Recibo guardado. Generando la versión definitiva...', type: 'info' });
                await refreshSavedPdf(targetReceipt.idRecibo);
                setNotification({ message: 'Recibo autorizado y listo para impresión.', type: 'success' });
            } else {
                setNotification({ message: 'No se pudo autorizar el recibo porque no se generó su registro.', type: 'error' });
            }
        } catch (error) {
            setNotification({ message: error.response?.data?.message || 'No fue posible autorizar el recibo.', type: 'error' });
        } finally {
            setIsAuthorizing(false);
        }
    };

    if (!receiptDraft) {
        return null;
    }

    const lineCount = receiptDraft.items?.length ?? 0;

    const handlePrintReceipt = () => {
        if (!savedReceipt?.idRecibo || !pdfUrl) {
            setNotification({ message: 'Autoriza el documento antes de imprimirlo.', type: 'warning' });
            return;
        }

        window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    };

    const downloadExport = async (format) => {
        if (!savedReceipt?.idRecibo) return;
        try {
            const response = await axiosClient.get(`/ventas/recibos/${savedReceipt.idRecibo}/${format}`, { responseType: 'blob' });
            const url = URL.createObjectURL(response.data);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = format === 'docx' ? `${savedReceipt.numeroRecibo}.docx` : `detalle-${savedReceipt.numeroRecibo}.xlsx`;
            anchor.click();
            URL.revokeObjectURL(url);
        } catch {
            setNotification({ message: `No fue posible generar el archivo ${format === 'docx' ? 'Word' : 'Excel'}.`, type: 'error' });
        }
    };

    return (
        <div className="min-h-[calc(100vh-8rem)] rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
            <div className="space-y-6">
                <section className="space-y-5">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className={`flex flex-col gap-4 border-b px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between ${isCredit ? 'border-slate-600 bg-slate-700' : 'border-teal-800 bg-teal-900'}`}>
                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.25em] text-slate-200">{isCredit ? 'Nota de crédito' : 'Recibo generado'}</p>
                                    <h1 className="mt-1 text-2xl font-semibold text-white">Revisa si el documento está correcto</h1>
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
                                    disabled={isAuthorizing || isLoadingPreview || Boolean(savedReceipt?.idRecibo)}
                                    className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <ShieldCheck className="h-4 w-4" />
                                    {isAuthorizing ? 'Autorizando...' : savedReceipt?.idRecibo ? 'Documento autorizado' : `Autorizar ${isCredit ? 'nota' : 'recibo'}`}
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePrintReceipt}
                                    disabled={!savedReceipt?.idRecibo}
                                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-teal-900 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Printer className="h-4 w-4" />
                                    Imprimir PDF
                                </button>
                                <button type="button" onClick={() => downloadExport('docx')} disabled={!savedReceipt?.idRecibo} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"><FileText className="h-4 w-4" />Word</button>
                                <button type="button" onClick={() => downloadExport('excel')} disabled={!savedReceipt?.idRecibo} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"><Table2 className="h-4 w-4" />Excel</button>
                            </div>
                        </div>

                        <div className="border-b border-teal-100 bg-teal-50/70 px-5 py-3 text-sm text-teal-950">
                            <span className="font-semibold text-teal-900">{isCredit ? 'Nota pendiente:' : 'Recibo pendiente:'}</span> {receiptDraft.numeroRecibo || 'se asigna al guardar'}
                            {' · '}
                            <span className="font-semibold text-teal-900">Factura:</span> {receiptDraft.numeroFactura}
                        </div>

                        {isCredit && (
                            <div className="grid gap-3 border-b border-slate-200 bg-slate-100 p-5 sm:grid-cols-3">
                                <div><p className="text-xs font-medium uppercase text-slate-500">Cliente autorizado</p><p className="mt-1 font-semibold text-slate-900">{receiptDraft.cliente.nombre}</p><p className="text-sm text-slate-600">{receiptDraft.cliente.nit || 'CF'}</p></div>
                                <div><p className="text-xs font-medium uppercase text-slate-500">Pago inicial</p><p className="mt-1 text-xl font-bold text-slate-900">{money.format(initialPayment)}</p></div>
                                <div><p className="text-xs font-medium uppercase text-slate-500">Restante</p><p className="mt-1 text-xl font-bold text-slate-900">{money.format(pendingAmount)}</p><p className="text-sm text-slate-600">{receiptDraft.paymentDetails.credit.installments} cuotas</p></div>
                            </div>
                        )}

                        <div className="p-4 sm:p-5">
                            <div className="rounded-lg border border-slate-200 bg-slate-100 p-2">
                                <div className="aspect-[8.3/11.7] overflow-hidden rounded-md bg-white">
                                    {isLoadingPreview || !pdfUrl ? (
                                        <div className="flex h-full items-center justify-center p-8 text-center text-slate-500">
                                            <div className="max-w-sm space-y-3">
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
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-teal-700">Resumen</p>
                                <h2 className="mt-1 text-xl font-semibold text-slate-900">Pedido listo para revisión</h2>
                            </div>
                            <div className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                                {money.format(isCredit ? initialPayment : receiptDraft.total)}
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

                            {savedReceipt?.numeroRecibo && (
                                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-900">
                                    <div className="flex items-start gap-3">
                                        <BadgeCheck className="mt-0.5 h-5 w-5 flex-none" />
                                        <div>
                                            <p className="font-semibold">{isCredit ? 'Nota de crédito guardada' : 'Recibo guardado'}</p>
                                            <p className="mt-1 text-sm text-emerald-800">
                                                {savedReceipt.numeroRecibo} · {savedReceipt.numeroFactura}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                </aside>
            </div>
            <NotificationToast notification={notification} onClose={() => setNotification(null)} />
        </div>
    );
}
