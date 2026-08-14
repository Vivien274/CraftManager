'use client';

import { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  CreditCard,
  Banknote,
  QrCode,
  Gift,
  Store,
  Users,
  Globe,
  Search,
  X,
  Trash2,
  Printer,
  Package,
} from 'lucide-react';
import { useCraftStore } from '@/lib/store/craftStore';
import { formatCurrency } from '@/lib/utils/calculator';
import { SaleChannel, PaymentMethod } from '@/lib/types/craft';
import FeatureGate from '@/components/common/FeatureGate';

export default function POSPage() {
  return (
    <FeatureGate
      feature="pos"
      title="Caisse Tactile Stand & Marché"
      description="Encaissez vos ventes en 2 clics sur les marchés et déstockez vos savons en temps réel avec la Formule Expert."
      requiredTier="expert"
    >
      <POSContent />
    </FeatureGate>
  );
}

function POSContent() {
  const {
    isLoaded,
    organisation,
    products,
    cart,
    addToCart,
    updateCartQuantity,
    clearCart,
    completeSale,
  } = useCraftStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<SaleChannel>('market');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [terminalType, setTerminalType] = useState<'sumup' | 'mypos' | 'zettle'>('sumup');
  const [qrMode, setQrMode] = useState<'paylib' | 'paypal'>('paylib');
  const [givenAmount, setGivenAmount] = useState<number>(0);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<any>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const cartTotal = cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const changeToReturn = Math.max(0, givenAmount - cartTotal);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const sale = completeSale(selectedChannel, selectedPayment);
    if (sale) {
      setLastCompletedSale({ ...sale, changeToReturn, givenAmount });
      setIsReceiptModalOpen(true);
    }
  };

  const getCartQuantityForProduct = (productId: string) => {
    const found = cart.find((item) => item.product.id === productId);
    return found ? found.quantity : 0;
  };

  if (!isLoaded) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium animate-pulse">
        Chargement de la Caisse Tactile Savonnerie...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Bar: Mode & Sales Channel Selector */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 bg-white shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">Caisse Tactile Stand & Marché</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                Savonnerie
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Encaissement rapide & déstockage automatique en direct</p>
          </div>
        </div>

        {/* Channel Selection Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setSelectedChannel('market')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              selectedChannel === 'market'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4" />
            Marché / Salon
          </button>
          <button
            onClick={() => setSelectedChannel('direct')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              selectedChannel === 'direct'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Vente Atelier
          </button>
          <button
            onClick={() => setSelectedChannel('web')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              selectedChannel === 'web'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            Commande Web
          </button>
        </div>
      </div>

      {/* Main POS Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Section: Search, Filters & Touch Product Cards (7 Cols) */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher un savon, formule ou catégorie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input w-full text-sm font-semibold text-slate-800 bg-white border-slate-300 shadow-sm"
              style={{ paddingLeft: '2.75rem', paddingRight: search ? '2.5rem' : '1rem' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition border shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Tous ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition border shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Touch-Friendly Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              const inCartQty = getCartQuantityForProduct(product.id);
              const isOutOfStock = product.stock_quantity <= 0;

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && addToCart(product)}
                  className={`bg-white rounded-2xl p-4 border transition-all text-left flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-sm ${
                    inCartQty > 0
                      ? 'border-amber-400 ring-2 ring-amber-400/30 bg-amber-50/20'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                  } ${isOutOfStock ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'}`}
                >
                  {/* Cart Quantity Badge Overlay */}
                  {inCartQty > 0 && (
                    <span className="absolute top-3 right-3 bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-full shadow-md z-10 animate-in zoom-in-50 duration-150">
                      x{inCartQty}
                    </span>
                  )}

                  <div className="space-y-3">
                    {/* Top Row: Image Thumbnail & Stock Pill */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <span className="text-2xl">🧼</span>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            product.stock_quantity > 10
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : product.stock_quantity > 0
                              ? 'bg-amber-50 text-amber-900 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {product.stock_quantity > 0 ? `Stock : ${product.stock_quantity}` : 'Rupture'}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          {product.category}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Product Name */}
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm line-clamp-2 leading-snug group-hover:text-indigo-600 transition">
                        {product.name}
                      </h3>
                      {product.sku && (
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{product.sku}</span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Price & Add Action Button */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
                    <div>
                      <span className="text-emerald-700 font-black text-lg">
                        {formatCurrency(product.selling_price)}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isOutOfStock}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition ${
                        inCartQty > 0
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                          : 'bg-indigo-600 text-white hover:bg-indigo-500'
                      }`}
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Ajouter</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Section: Interactive Cart & Payment Dispenser (5 Cols) */}
        <div className="lg:col-span-5 xl:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-md space-y-5 sticky top-20">
          {/* Cart Header: Clean Non-wrapping Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-600 shrink-0" />
              <h2 className="font-black text-slate-900 text-base whitespace-nowrap">Panier</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold border border-amber-300 whitespace-nowrap">
                {cartCount} art.
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-slate-500 hover:text-red-600 font-bold transition flex items-center gap-1 whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Vider
              </button>
            )}
          </div>

          {/* Cart Items List with 2-Row Uncluttered Item Layout */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium border-2 border-dashed border-slate-200 rounded-xl">
                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <span>Toucher un savon pour l'ajouter au panier</span>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2 hover:border-slate-300 transition"
                >
                  {/* Top Line: Full Product Title & Delete Button */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-extrabold text-slate-900 text-xs leading-snug flex-1">{item.product.name}</h4>
                    <button
                      onClick={() => updateCartQuantity(item.product.id, 0)}
                      className="text-slate-400 hover:text-red-600 transition p-0.5 rounded hover:bg-slate-200 shrink-0"
                      title="Supprimer du panier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Bottom Line: Unit Price, Stepper & Line Total */}
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/70">
                    <span className="text-slate-500 text-[11px] font-medium">
                      {formatCurrency(item.product.selling_price)} / u
                    </span>

                    {/* Stepper */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-md bg-white border border-slate-300 text-slate-700 flex items-center justify-center hover:bg-slate-100 font-bold shadow-2xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-extrabold text-slate-900 w-5 text-center text-xs">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-md bg-white border border-slate-300 text-slate-700 flex items-center justify-center hover:bg-slate-100 font-bold shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-black text-emerald-700 text-sm">
                      {formatCurrency(item.product.selling_price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2 pt-3 border-t border-slate-200">
            <span className="text-[11px] uppercase font-black tracking-wider text-slate-500 block">
              Moyen de Paiement
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedPayment('cash')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                  selectedPayment === 'cash'
                    ? 'bg-emerald-100 text-emerald-950 border-emerald-400 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600" /> Espèces (Cash)
              </button>
              <button
                onClick={() => setSelectedPayment('card')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                  selectedPayment === 'card'
                    ? 'bg-indigo-100 text-indigo-950 border-indigo-400 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4 text-indigo-600" /> Carte CB / SumUp
              </button>
              <button
                onClick={() => setSelectedPayment('qr_transfer')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                  selectedPayment === 'qr_transfer'
                    ? 'bg-purple-100 text-purple-950 border-purple-400 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-4 h-4 text-purple-600" /> QR / Paylib
              </button>
              <button
                onClick={() => setSelectedPayment('gift')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                  selectedPayment === 'gift'
                    ? 'bg-pink-100 text-pink-950 border-pink-400 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Gift className="w-4 h-4 text-pink-600" /> Offert / Don
              </button>
            </div>
          </div>

          {/* SumUp / myPOS / Zettle TPE Quick Trigger Banner */}
          {selectedPayment === 'card' && cartTotal > 0 && (
            <div className="bg-indigo-50/90 p-3.5 rounded-2xl border border-indigo-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-indigo-950 flex items-center gap-1.5 text-[11px]">
                  📱 Terminal TPE Connecté :
                </span>
                <span className="text-[10px] font-bold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full">
                  Zéro Config ⚡
                </span>
              </div>

              {/* Brand Selector Buttons */}
              <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-indigo-100 font-bold text-[11px]">
                <button
                  onClick={() => setTerminalType('sumup')}
                  className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer ${
                    terminalType === 'sumup' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  SumUp
                </button>
                <button
                  onClick={() => setTerminalType('mypos')}
                  className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer ${
                    terminalType === 'mypos' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  myPOS
                </button>
                <button
                  onClick={() => setTerminalType('zettle')}
                  className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer ${
                    terminalType === 'zettle' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Zettle
                </button>
              </div>

              <p className="text-[11px] text-slate-600 leading-snug">
                Transmet automatiquement <strong>{formatCurrency(cartTotal)}</strong> vers votre lecteur {terminalType === 'sumup' ? 'SumUp' : terminalType === 'mypos' ? 'myPOS' : 'Zettle par PayPal'}.
              </p>

              {terminalType === 'sumup' && (
                <a
                  href={`sumupmerchant://pay/v1?amount=${cartTotal}&currency=EUR&title=Savonnerie_CraftManager`}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm block text-center"
                >
                  ⚡ Payer {formatCurrency(cartTotal)} sur SumUp ↗
                </a>
              )}

              {terminalType === 'mypos' && (
                <a
                  href={`mypos://pay?amount=${cartTotal}&currency=EUR&title=Savonnerie_CraftManager`}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm block text-center"
                >
                  ⚡ Payer {formatCurrency(cartTotal)} sur myPOS ↗
                </a>
              )}

              {terminalType === 'zettle' && (
                <a
                  href={`zettle://pay?amount=${cartTotal}&currency=EUR&title=Savonnerie_CraftManager`}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm block text-center"
                >
                  ⚡ Payer {formatCurrency(cartTotal)} sur Zettle ↗
                </a>
              )}
            </div>
          )}

          {/* QR Code Paylib / Wero / PayPal Display Panel */}
          {selectedPayment === 'qr_transfer' && cartTotal > 0 && (
            <div className="bg-purple-50/90 p-4 rounded-2xl border border-purple-200 space-y-3 text-xs text-center shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-purple-950 flex items-center gap-1.5 text-[11px]">
                  📱 QR Code Paylib / Wero / PayPal
                </span>
                <span className="text-[10px] font-bold bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full">
                  Scan Instantané
                </span>
              </div>

              {/* Mode Switcher */}
              <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-xl border border-purple-100 font-bold text-[11px]">
                <button
                  onClick={() => setQrMode('paylib')}
                  className={`py-1.5 rounded-lg transition cursor-pointer ${
                    qrMode === 'paylib' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Paylib / Wero (Banque)
                </button>
                <button
                  onClick={() => setQrMode('paypal')}
                  className={`py-1.5 rounded-lg transition cursor-pointer ${
                    qrMode === 'paypal' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  PayPal.me
                </button>
              </div>

              {/* QR Code Graphic */}
              <div className="bg-white p-3 rounded-2xl border border-purple-200 inline-block shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    qrMode === 'paylib'
                      ? `PROMPT_PAYLIB:${organisation.paylib_phone || '0612345678'};AMOUNT:${cartTotal}`
                      : `${organisation.paypal_me_link || 'https://paypal.me/AtelierRestanques'}/${cartTotal}`
                  )}`}
                  alt="QR Code Paiement Instantané"
                  className="w-40 h-40 mx-auto rounded-lg"
                />
              </div>

              {qrMode === 'paylib' ? (
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-purple-950">
                    Scanner avec l'application bancaire ou l'appareil photo du client
                  </p>
                  <p className="text-[11px] font-mono text-slate-600">
                    N° Paylib / Wero : <strong>{organisation.paylib_phone || '06 12 34 56 78'}</strong>
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-purple-950">
                    Lien PayPal.me direct ({formatCurrency(cartTotal)})
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 truncate">
                    {organisation.paypal_me_link || 'https://paypal.me/AtelierRestanques'}/{cartTotal}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Cash Change Dispenser & Quick Amount Buttons */}
          {selectedPayment === 'cash' && cartTotal > 0 && (
            <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 space-y-3 text-xs">
              <span className="text-amber-950 font-black block text-[11px] uppercase tracking-wider">
                Calculateur de Monnaie à Rendre
              </span>

              {/* Quick Cash Touch Buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: 'Exact', value: cartTotal },
                  { label: '10 €', value: 10 },
                  { label: '20 €', value: 20 },
                  { label: '50 €', value: 50 },
                ].map((btn, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setGivenAmount(btn.value)}
                    className="py-1.5 px-2 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-[11px] font-bold text-amber-950 shadow-sm"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-slate-700 font-bold">Montant Reçu :</span>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    placeholder="0"
                    value={givenAmount || ''}
                    onChange={(e) => setGivenAmount(Number(e.target.value))}
                    className="glass-input w-28 text-right font-black text-slate-900 border-amber-300"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    €
                  </span>
                </div>
              </div>

              {givenAmount > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-amber-200 font-black">
                  <span className="text-slate-800">Monnaie à Rendre :</span>
                  <span className="text-amber-900 text-lg font-mono">{formatCurrency(changeToReturn)}</span>
                </div>
              )}
            </div>
          )}

          {/* Total & Checkout Action Button */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex justify-between items-center font-black text-slate-900">
              <span className="text-base">Total Encaissé :</span>
              <span className="text-emerald-700 text-2xl">{formatCurrency(cartTotal)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white py-4 rounded-xl font-black text-base shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              VALIDER L'ENCAISSEMENT
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Receipt Confirmation Ticket */}
      {isReceiptModalOpen && lastCompletedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 border border-emerald-300 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900">Vente Encaissée !</h2>
              <p className="text-xs text-slate-500 mt-1">Stock savon déstocké automatiquement avec succès.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-2 text-left border border-slate-200 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Canal Vente :</span>
                <span className="font-bold text-slate-900 capitalize">{lastCompletedSale.channel}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Paiement :</span>
                <span className="font-bold text-slate-900 capitalize">{lastCompletedSale.payment_method}</span>
              </div>
              {lastCompletedSale.givenAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Rendu Monnaie :</span>
                  <span className="font-bold text-amber-900">{formatCurrency(lastCompletedSale.changeToReturn)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 pt-2 border-t border-slate-200 font-black text-sm font-sans">
                <span>Total Encaissé :</span>
                <span className="text-emerald-700">{formatCurrency(lastCompletedSale.total_amount)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 glass-button py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 text-slate-700"
              >
                <Printer className="w-4 h-4" /> Ticket
              </button>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-md transition text-xs"
              >
                Vente Suivante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
