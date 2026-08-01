import { useEffect, useMemo, useState } from 'react';
import { Banknote, CreditCard, Search, Trash2, ReceiptText, Plus, UserRound, Building2, BadgeInfo } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { buildReceiptPdfPayload, buildReceiptPreview, paymentReferenceLabels, validateAddItem, validateGenerateReceipt } from '../middleware/ventasValidations';

const paymentMethods = [
    { id: 'efectivo', label: 'Efectivo', icon: Banknote },
    { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
    { id: 'transferencia', label: 'Transferencia', icon: BadgeInfo },
    { id: 'cheque', label: 'Cheque', icon: BadgeInfo },
    { id: 'credito', label: 'Por cobrar', icon: UserRound },
];

const money = new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
});

export default function VentasPage() {
    const navigate = useNavigate();
    const { user, selectedSucursalId, sucursales, isAdministrator } = useAuth();
    const [productQuery, setProductQuery] = useState('');
    const [productResults, setProductResults] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [cartItems, setCartItems] = useState([]);

    const [clientQuery, setClientQuery] = useState('');
    const [clientResults, setClientResults] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [customer, setCustomer] = useState({ nit: '', nombre: '', domicilio: '', telefono: '' });

    const [paymentMethod, setPaymentMethod] = useState('efectivo');
    const [paymentReference, setPaymentReference] = useState('');
    const [message, setMessage] = useState('');

    const total = useMemo(() => cartItems.reduce((sum, item) => sum + item.subtotal, 0), [cartItems]);
    const selectedBranch = useMemo(() => sucursales.find((branch) => String(branch.idSucursal) === String(selectedSucursalId)), [sucursales, selectedSucursalId]);
    const showProductBranch = isAdministrator && !selectedSucursalId;

    useEffect(() => {
        const term = productQuery.trim();

        if (term.length < 2) {
            setProductResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                const response = await axiosClient.get('/catalogo/productos', {
                    params: { query: term, idSucursal: selectedSucursalId || null },
                });

                setProductResults(response.data?.data ?? []);
            } catch {
                setProductResults([]);
            }
        }, 250);

        return () => clearTimeout(timeoutId);
    }, [productQuery, selectedSucursalId]);

    useEffect(() => {
        const term = clientQuery.trim();

        if (term.length < 2) {
            setClientResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                const response = await axiosClient.get('/catalogo/clientes', {
                    params: { query: term },
                });

                setClientResults(response.data?.data ?? []);
            } catch {
                setClientResults([]);
            }
        }, 250);

        return () => clearTimeout(timeoutId);
    }, [clientQuery]);

    useEffect(() => {
        if (paymentMethod === 'credito' && selectedClient) {
            setCustomer((current) => ({
                ...current,
                nit: selectedClient.nit || '',
                nombre: selectedClient.nombre || '',
                domicilio: selectedClient.direccion || '',
                telefono: selectedClient.telefono || '',
            }));
        }
    }, [paymentMethod, selectedClient]);

    const selectProduct = (product) => {
        setSelectedProduct(product);
        setProductQuery(`${product.idProducto} - ${product.nombre}`);
        setProductResults([]);
        setMessage('');
    };

    const selectClient = (client) => {
        setSelectedClient(client);
        setCustomer({
            nit: client.nit || '',
            nombre: client.nombre || '',
            domicilio: client.direccion || '',
            telefono: client.telefono || '',
        });
        setClientQuery(`${client.nit || ''} - ${client.nombre}`.trim());
        setClientResults([]);
        setMessage('');
    };

    const addItem = () => {
        const validationMessage = validateAddItem({ selectedProduct, quantity });
        if (validationMessage) {
            setMessage(validationMessage);
            return;
        }

        const qty = Number(quantity);
        const existingIndex = cartItems.findIndex((item) => item.idProducto === selectedProduct.idProducto);

        const nextItems = [...cartItems];

        if (existingIndex >= 0) {
            const currentItem = nextItems[existingIndex];
            const updatedQuantity = currentItem.cantidad + qty;
            nextItems[existingIndex] = {
                ...currentItem,
                cantidad: updatedQuantity,
                subtotal: updatedQuantity * currentItem.precioUnitario,
            };
        } else {
            nextItems.push({
                idProducto: selectedProduct.idProducto,
                nombre: selectedProduct.nombre,
                precioUnitario: Number(selectedProduct.precio),
                cantidad: qty,
                subtotal: Number(selectedProduct.precio) * qty,
                idSucursal: selectedProduct.idSucursal ?? selectedSucursalId ?? null,
                nombreSucursal: selectedProduct.nombreSucursal || selectedBranch?.nombreSuc || '',
            });
        }

        setCartItems(nextItems);
        setSelectedProduct(null);
        setProductQuery('');
        setQuantity(1);
        setProductResults([]);
        setMessage('Producto agregado al pedido.');
    };

    const removeItem = (idProducto) => {
        setCartItems((items) => items.filter((item) => item.idProducto !== idProducto));
    };

    const handleGenerateReceipt = async () => {
        const validation = validateGenerateReceipt({
            cartItems,
            customer,
            paymentMethod,
            selectedClient,
            paymentReference,
        });

        if (!validation.isValid) {
            setMessage(validation.message);
            return;
        }

        const sellerName = user?.nombre || user?.unique_name || 'Usuario';
        const receiptPreview = buildReceiptPreview({
            customer: validation.customer,
            paymentMethod,
            paymentReference,
            total,
            cartItems,
            sellerName,
            selectedClient,
            selectedBranch,
        });

        navigate('/ventas/recibo-preview', {
            state: {
                receiptDraft: receiptPreview,
                receiptPayload: buildReceiptPdfPayload({ receipt: receiptPreview }),
            },
        });
    };

    const paymentReferenceLabel = paymentReferenceLabels[paymentMethod];
    const requiresReference = Boolean(paymentReferenceLabel);

    return (
        <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
                <section className="space-y-6">
                    <div className="rounded-3xl border border-white/60 bg-white/90 p-5 shadow-sm backdrop-blur">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Buscar producto</h2>
                            </div>
                            <div className="rounded-full bg-teal-50 p-3 text-brand-teal">
                                <Search className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-[1.7fr_0.7fr_auto]">
                            <div className="relative">
                                <input
                                    value={productQuery}
                                    onChange={(event) => {
                                        setProductQuery(event.target.value);
                                        setSelectedProduct(null);
                                    }}
                                    placeholder="Ej. 12 o arroz"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-teal focus:bg-white"
                                />
                                {productResults.length > 0 && (
                                    <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
                                        {productResults.map((product) => (
                                            <button
                                                key={product.idProducto}
                                                type="button"
                                                onClick={() => selectProduct(product)}
                                                className="flex w-full items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-slate-50 last:border-b-0"
                                            >
                                                <div>
                                                    <p className="font-medium text-slate-900">{product.idProducto} - {product.nombre}</p>
                                                    <p className="text-xs text-slate-500">{product.descripcion || 'Sin descripción'}</p>
                                                    {showProductBranch && (
                                                        <p className="text-[11px] uppercase tracking-[0.18em] text-teal-700">
                                                            {product.nombreSucursal || 'Sucursal no asignada'}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-brand-teal">
                                                    {money.format(product.precio)}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(event) => setQuantity(event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-teal focus:bg-white"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={addItem}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-teal px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-100 transition hover:translate-y-[-1px] hover:bg-teal-700"
                            >
                                <Plus className="h-4 w-4" />
                                Agregar
                            </button>
                        </div>

                        {selectedProduct && (
                            <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-teal-100 bg-teal-50 p-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-teal-900">{selectedProduct.idProducto} - {selectedProduct.nombre}</p>
                                    <p className="text-xs text-teal-700">Precio unitario: {money.format(selectedProduct.precio)}</p>
                                    <p className="text-xs uppercase tracking-[0.2em] text-teal-700">Sucursal: {selectedProduct.nombreSucursal || selectedBranch?.nombreSuc || 'Sin sucursal'}</p>
                                </div>
                                <div className="text-sm font-semibold text-teal-900">Subtotal: {money.format(Number(selectedProduct.precio) * Number(quantity || 0))}</div>
                            </div>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Pedido</h2>
                                <p className="text-sm text-slate-500">Solo puedes eliminar productos, no editar líneas.</p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{cartItems.length} líneas</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 text-sm">
                                <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                                    <tr>
                                        <th className="px-5 py-3">Producto</th>
                                        <th className="px-5 py-3">Sucursal</th>
                                        <th className="px-5 py-3">Cantidad</th>
                                        <th className="px-5 py-3">Precio</th>
                                        <th className="px-5 py-3">Subtotal</th>
                                        <th className="px-5 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {cartItems.length === 0 ? (
                                        <tr>
                                            <td className="px-5 py-8 text-slate-500" colSpan="6">
                                                Aún no agregas productos al pedido.
                                            </td>
                                        </tr>
                                    ) : (
                                        cartItems.map((item) => (
                                            <tr key={item.idProducto}>
                                                <td className="px-5 py-4 font-medium text-slate-900">{item.nombre}</td>
                                                <td className="px-5 py-4 text-slate-700">{item.nombreSucursal || selectedBranch?.nombreSuc || 'Sin sucursal'}</td>
                                                <td className="px-5 py-4 text-slate-700">{item.cantidad}</td>
                                                <td className="px-5 py-4 text-slate-700">{money.format(item.precioUnitario)}</td>
                                                <td className="px-5 py-4 font-semibold text-slate-900">{money.format(item.subtotal)}</td>
                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(item.idProducto)}
                                                        className="inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <aside className="space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Cliente y facturación</h2>
                                <p className="text-sm text-slate-500">CF por defecto o buscar por NIT en el catálogo.</p>
                            </div>
                            <Building2 className="h-5 w-5 text-brand-teal" />
                        </div>

                        <div className="mt-4 space-y-3">
                            <div className="relative">
                                <input
                                    value={clientQuery}
                                    onChange={(event) => {
                                        setClientQuery(event.target.value);
                                        setSelectedClient(null);
                                    }}
                                    placeholder="Buscar cliente por NIT o nombre"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-teal focus:bg-white"
                                />
                                {clientResults.length > 0 && (
                                    <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
                                        {clientResults.map((client) => (
                                            <button
                                                key={client.idCliente}
                                                type="button"
                                                onClick={() => selectClient(client)}
                                                className="flex w-full flex-col gap-1 border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-slate-50 last:border-b-0"
                                            >
                                                <p className="font-medium text-slate-900">{client.nombre}</p>
                                                <p className="text-xs text-slate-500">
                                                    NIT: {client.nit || 'CF'} · {client.direccion || 'Sin dirección'}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <input
                                value={customer.nit}
                                onChange={(event) => {
                                    setCustomer((current) => ({ ...current, nit: event.target.value }));
                                    setSelectedClient(null);
                                }}
                                placeholder="Buscar por nit o cf"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-teal focus:bg-white"
                            />

                            <input
                                value={customer.nombre}
                                onChange={(event) => setCustomer((current) => ({ ...current, nombre: event.target.value }))}
                                placeholder="Nombre del cliente"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-teal focus:bg-white"
                            />

                            <input
                                value={customer.telefono}
                                onChange={(event) => setCustomer((current) => ({ ...current, telefono: event.target.value }))}
                                placeholder="Teléfono"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-teal focus:bg-white"
                            />

                            <textarea
                                value={customer.domicilio}
                                onChange={(event) => setCustomer((current) => ({ ...current, domicilio: event.target.value }))}
                                placeholder="Domicilio"
                                rows={3}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-teal focus:bg-white"
                            />
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Método de pago</h2>
                                <p className="text-sm text-slate-500">Elige cómo se pagará el pedido.</p>
                            </div>
                            <ReceiptText className="h-5 w-5 text-brand-teal" />
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            {paymentMethods.map((method) => {
                                const Icon = method.icon;
                                const isActive = paymentMethod === method.id;

                                return (
                                    <button
                                        key={method.id}
                                        type="button"
                                        onClick={() => {
                                            setPaymentMethod(method.id);
                                            setPaymentReference('');
                                            setMessage('');
                                        }}
                                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${isActive ? 'border-brand-teal bg-teal-50 text-slate-900' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'}`}
                                    >
                                        <span className={`rounded-full p-2 ${isActive ? 'bg-brand-teal text-white' : 'bg-white text-slate-500'}`}>
                                            <Icon className="h-4 w-4" />
                                        </span>
                                        <span className="font-medium">{method.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {requiresReference && (
                            <div className="mt-4">
                                <label className="mb-2 block text-sm font-medium text-slate-700">{paymentReferenceLabel}</label>
                                <input
                                    value={paymentReference}
                                    onChange={(event) => setPaymentReference(event.target.value)}
                                    placeholder={paymentReferenceLabel}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-teal focus:bg-white"
                                />
                            </div>
                        )}

                        {paymentMethod === 'credito' && (
                            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                Para <strong>por cobrar</strong>, selecciona un cliente existente del catálogo para dejar el saldo pendiente registrado.
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleGenerateReceipt}
                            disabled={cartItems.length === 0}
                            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            Generar recibo
                        </button>
                    </div>

                    {message && (
                        <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-900">
                            {message}
                        </div>
                    )}

                </aside>
            </div>

            <div className="rounded-3xl bg-sky-300 px-6 py-4 text-slate-900 shadow-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Total actual</span>
                    <span className="text-3xl font-bold">{money.format(total)}</span>
                </div>
            </div>
        </div>
    );
}