'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Users,
  Building2,
  UserCheck,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  DollarSign,
  Calendar,
  Sparkles,
  Trash2,
  Edit,
  X,
  AlertCircle,
  FileText,
  Mail,
  Send,
} from 'lucide-react';
import { useCraftStore } from '@/lib/store/craftStore';
import { formatCurrency } from '@/lib/utils/calculator';
import { OrderStatus, PaymentStatus, ClientType, Order } from '@/lib/types/craft';
import { InvoiceModal } from '@/components/orders/InvoiceModal';

export default function OrdersPage() {
  const {
    isLoaded,
    organisation,
    products,
    clients,
    orders,
    addClient,
    updateClient,
    deleteClient,
    addOrder,
    updateOrderStatus,
    updateOrderPaymentStatus,
    deleteOrder,
  } = useCraftStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'clients'>('orders');

  // Search & Filter state
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [clientSearch, setClientSearch] = useState('');

  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  // Invoice Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  // New Client Form
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientType, setClientType] = useState<ClientType>('b2b');
  const [clientNotes, setClientNotes] = useState('');

  // New Order Form
  const [selectedClientId, setSelectedClientId] = useState('');
  const [orderClientEmail, setOrderClientEmail] = useState('');
  const [autoSendInvoice, setAutoSendInvoice] = useState(true);
  const [orderDeliveryDate, setOrderDeliveryDate] = useState('');
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('pending');
  const [orderPaymentStatus, setOrderPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderItems, setOrderItems] = useState<
    { product_id: string; quantity: number; unit_price: number }[]
  >([]);
  const [formError, setFormError] = useState('');

  // Sync client email when client selection changes in Order Modal
  useEffect(() => {
    if (selectedClientId) {
      const c = clients.find((cli) => cli.id === selectedClientId);
      if (c && c.email) {
        setOrderClientEmail(c.email);
      }
    }
  }, [selectedClientId, clients]);

  if (!isLoaded) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium animate-pulse">
        Chargement du carnet de commandes...
      </div>
    );
  }

  // Summary Metrics
  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'processing'
  ).length;

  const totalCommittedCA = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total_amount, 0);

  const b2bClientsCount = clients.filter((c) => c.client_type === 'b2b').length;

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
    return true;
  });

  // Filtered Clients
  const filteredClients = clients.filter((c) => {
    const q = clientSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.company_name && c.company_name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  // Handle Client Submit
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    if (editingClientId) {
      await updateClient(editingClientId, {
        name: clientName,
        company_name: clientCompany,
        email: clientEmail,
        phone: clientPhone,
        address: clientAddress,
        client_type: clientType,
        notes: clientNotes,
      });
    } else {
      await addClient({
        name: clientName,
        company_name: clientCompany,
        email: clientEmail,
        phone: clientPhone,
        address: clientAddress,
        client_type: clientType,
        notes: clientNotes,
      });
    }

    setIsClientModalOpen(false);
    resetClientForm();
  };

  const resetClientForm = () => {
    setEditingClientId(null);
    setClientName('');
    setClientCompany('');
    setClientEmail('');
    setClientPhone('');
    setClientAddress('');
    setClientType('b2b');
    setClientNotes('');
  };

  const handleEditClient = (c: typeof clients[0]) => {
    setEditingClientId(c.id);
    setClientName(c.name);
    setClientCompany(c.company_name || '');
    setClientEmail(c.email || '');
    setClientPhone(c.phone || '');
    setClientAddress(c.address || '');
    setClientType(c.client_type);
    setClientNotes(c.notes || '');
    setIsClientModalOpen(true);
  };

  // Handle Order Item Form Helper
  const handleAddOrderItem = () => {
    if (products.length === 0) {
      setFormError("Aucun produit dans le catalogue. Veuillez d'abord créer un produit.");
      return;
    }
    setFormError('');
    // Try picking a product that isn't already added
    const unusedProduct =
      products.find((p) => !orderItems.some((item) => item.product_id === p.id)) || products[0];

    setOrderItems((prev) => [
      ...prev,
      {
        product_id: unusedProduct.id,
        quantity: 10,
        unit_price: unusedProduct.selling_price || 0,
      },
    ]);
  };

  const handleRemoveOrderItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setOrderItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              product_id: productId,
              unit_price: prod ? Number(prod.selling_price) : item.unit_price,
            }
          : item
      )
    );
  };

  const handleItemQuantityChange = (index: number, qty: number) => {
    setOrderItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: Math.max(1, qty) } : item))
    );
  };

  const handleItemUnitPriceChange = (index: number, price: number) => {
    setOrderItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, unit_price: Math.max(0, price) } : item))
    );
  };

  const calculateOrderFormTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  };

  // Handle Order Submit
  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedClientId) {
      setFormError('Veuillez sélectionner un client pour cette commande.');
      return;
    }

    if (orderItems.length === 0) {
      setFormError('Veuillez ajouter au moins un produit à la commande.');
      return;
    }

    // If client email was entered or updated in the form, update client details
    if (selectedClientId && orderClientEmail) {
      const curClient = clients.find((c) => c.id === selectedClientId);
      if (curClient && curClient.email !== orderClientEmail) {
        await updateClient(selectedClientId, { email: orderClientEmail });
      }
    }

    const orderNumber = `CMD-2026-${String(orders.length + 1).padStart(3, '0')}`;
    const totalAmount = calculateOrderFormTotal();

    const formattedItems = orderItems.map((it, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      order_id: '',
      product_id: it.product_id,
      product: products.find((p) => p.id === it.product_id),
      quantity: Number(it.quantity),
      unit_price: Number(it.unit_price),
    }));

    const newOrderData = {
      order_number: orderNumber,
      client_id: selectedClientId,
      status: orderStatus,
      payment_status: orderPaymentStatus,
      target_delivery_date: orderDeliveryDate,
      total_amount: totalAmount,
      notes: orderNotes,
      items: formattedItems,
    };

    await addOrder(newOrderData);

    const fullCreatedOrder: Order = {
      id: `ord-${Date.now()}`,
      organisation_id: organisation.id,
      ...newOrderData,
      created_at: new Date().toISOString(),
    };

    setIsOrderModalOpen(false);

    // Auto-send invoice if checked
    if (autoSendInvoice && orderClientEmail) {
      try {
        await fetch('/api/send-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientEmail: orderClientEmail,
            clientName: clients.find((c) => c.id === selectedClientId)?.name || 'Client',
            orderNumber,
            totalAmount,
            items: formattedItems,
            organisationName: organisation.name,
          }),
        });
      } catch (err) {
        console.error('Error auto-sending invoice:', err);
      }

      // Open invoice modal for confirmation/printing
      setSelectedInvoiceOrder(fullCreatedOrder);
      setIsInvoiceModalOpen(true);
    }

    resetOrderForm();
  };

  const resetOrderForm = () => {
    setSelectedClientId('');
    setOrderClientEmail('');
    setAutoSendInvoice(true);
    setOrderDeliveryDate('');
    setOrderStatus('pending');
    setOrderPaymentStatus('unpaid');
    setOrderNotes('');
    setOrderItems([]);
    setFormError('');
  };

  const handleOpenOrderModal = () => {
    resetOrderForm();
    if (clients.length > 0) {
      setSelectedClientId(clients[0].id);
      setOrderClientEmail(clients[0].email || '');
    }
    if (products.length > 0) {
      setOrderItems([
        {
          product_id: products[0].id,
          quantity: 10,
          unit_price: products[0].selling_price || 0,
        },
      ]);
    }
    setIsOrderModalOpen(true);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5" /> En attente
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <Sparkles className="w-3.5 h-3.5" /> En préparation
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
            <Truck className="w-3.5 h-3.5" /> Expédiée
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Livrée
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-3.5 h-3.5" /> Annulée
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-900 border border-indigo-200">
              Gestion Commerciale B2B & B2C
            </span>
            <span className="text-xs text-slate-500 font-medium">Carnet de Commandes</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-indigo-600" />
            Carnet de Commandes & Fichier Clients
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enregistrez vos commandes clients, gérez vos boutiques revendeuses et déstockez vos savons finis.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              resetClientForm();
              setIsClientModalOpen(true);
            }}
            className="glass-button px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4 text-indigo-600" />
            Nouveau Client
          </button>
          <button
            onClick={handleOpenOrderModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            Créer une Commande
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Commandes en cours</p>
            <p className="text-2xl font-black text-slate-900">{pendingOrdersCount}</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">CA Engagé dans le Carnet</p>
            <p className="text-2xl font-black text-emerald-600">{formatCurrency(totalCommittedCA)}</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Clients & Boutiques B2B</p>
            <p className="text-2xl font-black text-slate-900">
              {clients.length} <span className="text-xs font-medium text-slate-500">({b2bClientsCount} B2B)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'orders'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Commandes Clients ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'clients'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Fichier Clients ({clients.length})
        </button>
      </div>

      {/* TAB 1: ORDERS LIST */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
            <span className="font-bold text-slate-500 mr-2">Filtrer par statut :</span>
            {[
              { id: 'all', label: 'Toutes les commandes' },
              { id: 'pending', label: '🟡 En attente' },
              { id: 'processing', label: '🔵 En préparation' },
              { id: 'shipped', label: '🟣 Expédiées' },
              { id: 'delivered', label: '🟢 Livrées' },
              { id: 'cancelled', label: '🔴 Annulées' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setOrderStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                  orderStatusFilter === f.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-200 space-y-3 bg-white">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-base">Aucune commande trouvée</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {orders.length === 0
                  ? "Vous n'avez pas encore enregistré de commande client. Cliquez sur le bouton ci-dessous pour créer votre première commande."
                  : 'Aucune commande ne correspond aux filtres sélectionnés.'}
              </p>
              <button
                onClick={handleOpenOrderModal}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-2 shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                Créer une Commande
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((ord) => {
                const client = clients.find((c) => c.id === ord.client_id) || ord.client;

                return (
                  <div
                    key={ord.id}
                    className="glass-panel p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-900 border border-indigo-200">
                            {ord.order_number}
                          </span>
                          {getStatusBadge(ord.status)}
                          <button
                            type="button"
                            onClick={() =>
                              updateOrderPaymentStatus(
                                ord.id,
                                ord.payment_status === 'paid' ? 'unpaid' : 'paid'
                              )
                            }
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition ${
                              ord.payment_status === 'paid'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                            }`}
                          >
                            <span>{ord.payment_status === 'paid' ? 'Payée 🟢' : 'Non payée 🔴'}</span>
                            <div
                              className={`w-7 h-4 flex items-center rounded-full p-0.5 transition duration-200 ${
                                ord.payment_status === 'paid' ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                              }`}
                            >
                              <div className="bg-white w-3 h-3 rounded-full shadow-sm" />
                            </div>
                          </button>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
                          {client ? (
                            <>
                              <span>{client.name}</span>
                              {client.company_name && (
                                <span className="text-xs text-slate-500 font-normal">
                                  ({client.company_name})
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                  client.client_type === 'b2b'
                                    ? 'bg-purple-100 text-purple-900'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {client.client_type}
                              </span>
                            </>
                          ) : (
                            <span>Client inconnu</span>
                          )}
                        </h3>
                      </div>

                      <div className="text-right sm:text-right flex sm:flex-col justify-between items-center sm:items-end">
                        <span className="text-xs text-slate-500">Montant total TTC</span>
                        <span className="text-xl font-black text-indigo-600">
                          {formatCurrency(ord.total_amount)}
                        </span>
                      </div>
                    </div>

                    {/* Order Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* Products List */}
                      <div className="md:col-span-2 space-y-2">
                        <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                          Produits commandés ({ord.items.length})
                        </p>
                        <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          {ord.items.map((item, idx) => {
                            const prod = products.find((p) => p.id === item.product_id) || item.product;
                            return (
                              <div
                                key={idx}
                                className="flex justify-between items-center text-xs pb-1 border-b border-slate-200/60 last:border-0 last:pb-0"
                              >
                                <span className="font-medium text-slate-800">
                                  {prod?.name || 'Produit'} x <strong className="text-indigo-600">{item.quantity}</strong>
                                </span>
                                <span className="font-mono text-slate-600">
                                  {item.quantity} x {formatCurrency(item.unit_price)} ={' '}
                                  <strong className="text-slate-900">{formatCurrency(item.quantity * item.unit_price)}</strong>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Info & Status Controls */}
                      <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
                        <div>
                          {ord.target_delivery_date && (
                            <p className="flex items-center gap-1.5 text-slate-600 mb-1">
                              <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>Livraison prévue le : <strong>{ord.target_delivery_date}</strong></span>
                            </p>
                          )}

                          {ord.notes && (
                            <p className="text-slate-600 italic bg-white p-2 rounded border border-slate-200 text-[11px]">
                              "{ord.notes}"
                            </p>
                          )}
                        </div>

                        {/* Change Status Dropdown */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-200">
                          <label className="block text-[10px] font-bold uppercase text-slate-500">
                            Changer le statut de la commande :
                          </label>
                          <div className="flex items-center gap-1.5">
                            <select
                              value={ord.status}
                              onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                              className="glass-input text-xs py-1 px-2 w-full font-bold bg-white"
                            >
                              <option value="pending">🟡 En attente</option>
                              <option value="processing">🔵 En préparation</option>
                              <option value="shipped">🟣 Expédiée (Déstocke)</option>
                              <option value="delivered">🟢 Livrée</option>
                              <option value="cancelled">🔴 Annulée</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInvoiceOrder(ord);
                                setIsInvoiceModalOpen(true);
                              }}
                              title="Voir / Envoyer la Facture par email"
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 border border-indigo-200 shrink-0 transition"
                            >
                              <FileText className="w-3.5 h-3.5" /> Facture
                            </button>
                            <button
                              onClick={() => deleteOrder(ord.id)}
                              title="Supprimer la commande"
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg shrink-0 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLIENTS LIST */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un client par nom, boutique ou email..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="glass-input w-full pl-9"
              />
            </div>
            <button
              onClick={() => {
                resetClientForm();
                setIsClientModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shrink-0 transition"
            >
              <Plus className="w-4 h-4" />
              Nouveau Client
            </button>
          </div>

          {filteredClients.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-200 bg-white space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-base">Aucun client trouvé</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {clients.length === 0
                  ? "Votre fichier client est vide. Ajoutez vos premiers clients ou boutiques revendeuses."
                  : 'Aucun client ne correspond à votre recherche.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((c) => {
                const clientOrders = orders.filter((o) => o.client_id === c.id);
                const clientTotalSpend = clientOrders.reduce((sum, o) => sum + o.total_amount, 0);

                return (
                  <div
                    key={c.id}
                    className="glass-panel p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                              c.client_type === 'b2b'
                                ? 'bg-purple-100 text-purple-900 border-purple-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {c.client_type === 'b2b' ? 'Boutique / Pro (B2B)' : 'Particulier (B2C)'}
                          </span>
                          <h3 className="font-bold text-slate-900 text-base mt-1.5">{c.name}</h3>
                          {c.company_name && (
                            <p className="text-xs font-semibold text-indigo-600">{c.company_name}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditClient(c)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteClient(c.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 mt-3 text-xs text-slate-600">
                        {c.email && <p>📧 {c.email}</p>}
                        {c.phone && <p>📞 {c.phone}</p>}
                        {c.address && <p>📍 {c.address}</p>}
                        {c.notes && (
                          <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded mt-2 border border-slate-200">
                            "{c.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">
                        {clientOrders.length} commande(s)
                      </span>
                      <span className="font-bold text-emerald-600">
                        Total : {formatCurrency(clientTotalSpend)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: NEW / EDIT CLIENT */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                {editingClientId ? 'Modifier le Client' : 'Nouveau Client / Boutique'}
              </h2>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nom du Contact *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Sophie Martin"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="glass-input w-full font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Type de Client *</label>
                  <select
                    value={clientType}
                    onChange={(e) => setClientType(e.target.value as ClientType)}
                    className="glass-input w-full font-bold bg-white"
                  >
                    <option value="b2b">Boutique / Pro (B2B)</option>
                    <option value="b2c">Particulier (B2C)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Raison Sociale / Boutique</label>
                  <input
                    type="text"
                    placeholder="ex: Nature & Sens"
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    className="glass-input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="contact@boutique.fr"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="glass-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Téléphone</label>
                  <input
                    type="tel"
                    placeholder="06 12 34 56 78"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="glass-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Adresse de livraison</label>
                <input
                  type="text"
                  placeholder="Rue, Code Postal, Ville"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="glass-input w-full"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Notes / Préférences</label>
                <textarea
                  rows={2}
                  placeholder="ex: Remise habituelle 10%, livraison le lundi"
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className="glass-input w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="glass-button px-4 py-2 rounded-xl text-slate-700 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl font-bold shadow-md transition"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NEW ORDER */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                Nouvelle Commande Client
              </h2>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {clients.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-3">
                <p className="font-bold">⚠️ Aucun client enregistré</p>
                <p>Veuillez créer au moins un client avant de pouvoir générer une commande.</p>
                <button
                  onClick={() => {
                    setIsOrderModalOpen(false);
                    resetClientForm();
                    setIsClientModalOpen(true);
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow"
                >
                  + Créer un Client
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveOrder} className="space-y-4 text-xs">
                {/* 1. Client / Boutique & Email */}
                <div className="space-y-2">
                  <label className="block text-slate-800 font-bold">1. Pour quel client / boutique ? *</label>
                  <select
                    required
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="glass-input w-full bg-white font-medium text-sm py-2"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company_name ? `(${c.company_name})` : ''} [{c.client_type.toUpperCase()}]
                      </option>
                    ))}
                  </select>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-[11px] flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-indigo-600" />
                      Email du client (pour l'envoi de la facture)
                    </label>
                    <input
                      type="email"
                      value={orderClientEmail}
                      onChange={(e) => setOrderClientEmail(e.target.value)}
                      placeholder="ex: client@domaine.fr"
                      className="glass-input w-full text-xs font-medium bg-white"
                    />
                  </div>
                </div>

                {/* 2. Produits et quantité */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <label className="block text-slate-800 font-bold text-xs">
                      2. Produits & Quantités *
                    </label>
                    {products.length > 0 && (
                      <button
                        type="button"
                        onClick={handleAddOrderItem}
                        className="text-indigo-600 font-bold hover:text-indigo-800 text-xs flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Ajouter un produit
                      </button>
                    )}
                  </div>

                  {products.length === 0 ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-2">
                      <p className="font-bold">⚠️ Aucun produit disponible dans votre catalogue</p>
                      <p>Veuillez d'abord créer au moins un produit pour pouvoir ajouter des articles à la commande.</p>
                      <a
                        href="/products"
                        className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition"
                      >
                        + Aller aux Produits
                      </a>
                    </div>
                  ) : orderItems.length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs space-y-2">
                      <p>Aucun produit ajouté à la commande.</p>
                      <button
                        type="button"
                        onClick={handleAddOrderItem}
                        className="bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs inline-flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Ajouter un produit
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {orderItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200"
                        >
                          <div className="col-span-5">
                            <select
                              value={item.product_id}
                              onChange={(e) => handleItemProductChange(idx, e.target.value)}
                              className="glass-input w-full bg-white font-medium text-xs"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({formatCurrency(p.selling_price)})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-span-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemQuantityChange(idx, Number(e.target.value))}
                              className="glass-input w-full font-bold text-xs"
                              placeholder="Qté"
                            />
                          </div>

                          <div className="col-span-3">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) => handleItemUnitPriceChange(idx, Number(e.target.value))}
                              className="glass-input w-full text-xs font-mono"
                              placeholder="Prix U."
                            />
                          </div>

                          <div className="col-span-1 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveOrderItem(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Calcul du total */}
                <div className="bg-indigo-50 p-3.5 rounded-xl border border-indigo-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-indigo-950">3. Total calculé de la commande :</span>
                  <span className="text-xl font-black text-indigo-700">
                    {formatCurrency(calculateOrderFormTotal())}
                  </span>
                </div>

                {/* Option Envoi Automatique de Facture par Email */}
                <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="autoSendInvoice"
                    checked={autoSendInvoice}
                    onChange={(e) => setAutoSendInvoice(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label
                    htmlFor="autoSendInvoice"
                    className="text-xs font-bold text-indigo-950 cursor-pointer flex items-center gap-1.5"
                  >
                    <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                    Envoyer automatiquement la facture par email au client lors de la validation
                  </label>
                </div>

                {/* 4. Indiquer si payé ou non */}
                <div>
                  <label className="block text-slate-800 font-bold mb-1">4. État du Paiement :</label>
                  <button
                    type="button"
                    onClick={() => setOrderPaymentStatus(orderPaymentStatus === 'paid' ? 'unpaid' : 'paid')}
                    className={`w-full py-2.5 px-4 rounded-xl border flex items-center justify-between font-bold text-xs transition cursor-pointer ${
                      orderPaymentStatus === 'paid'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-sm'
                        : 'bg-rose-50 text-rose-900 border-rose-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-current" />
                      {orderPaymentStatus === 'paid' ? 'Commande Payée 🟢' : 'Commande Non Payée (À payer) 🔴'}
                    </span>
                    <div
                      className={`w-10 h-6 flex items-center rounded-full p-0.5 transition duration-300 ${
                        orderPaymentStatus === 'paid' ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <div className="bg-white w-5 h-5 rounded-full shadow-md transform transition" />
                    </div>
                  </button>
                </div>

                {/* 5. Date de livraison souhaitée */}
                <div>
                  <label className="block text-slate-800 font-bold mb-1">5. Date de livraison souhaitée</label>
                  <input
                    type="date"
                    value={orderDeliveryDate}
                    onChange={(e) => setOrderDeliveryDate(e.target.value)}
                    className="glass-input w-full font-medium"
                  />
                </div>

                {/* Notes optionnelles */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Notes / Remarques (optionnel)</label>
                  <textarea
                    rows={2}
                    placeholder="ex: Emballage individuel sous carton, livraison avant 12h"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="glass-input w-full"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsOrderModalOpen(false)}
                    className="glass-button px-4 py-2 rounded-xl text-slate-700 font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl font-bold shadow-md transition"
                  >
                    Valider la Commande
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* INVOICE PREVIEW & EMAIL MODAL */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          client={clients.find((c) => c.id === selectedInvoiceOrder.client_id)}
          organisation={organisation}
          isOpen={isInvoiceModalOpen}
          onClose={() => {
            setIsInvoiceModalOpen(false);
            setSelectedInvoiceOrder(null);
          }}
          onEmailUpdated={(newEmail) => {
            updateClient(selectedInvoiceOrder.client_id, { email: newEmail });
          }}
        />
      )}
    </div>
  );
}
