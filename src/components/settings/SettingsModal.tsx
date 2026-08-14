import { useState, useEffect } from 'react';
import { Store, User, Coins, Tag, Save, CheckCircle2, X, FileSpreadsheet, FileText, MapPin, Phone, Mail, Percent, Download, Upload, ShieldCheck, QrCode } from 'lucide-react';
import { useCraftStore } from '@/lib/store/craftStore';
import { createClient } from '@/lib/supabase/client';
import { CraftType, Organisation, VatMode } from '@/lib/types/craft';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { organisation, updateOrganisation, importTraceabilitySeed } = useCraftStore();
  const [name, setName] = useState(organisation.name || "L'Atelier des Restanques");
  const [craftType, setCraftType] = useState<CraftType>(organisation.craft_type || 'savonnerie');
  const [currency, setCurrency] = useState(organisation.currency || 'EUR');
  const [siret, setSiret] = useState(organisation.siret || '892 341 590 00012');
  const [address, setAddress] = useState(organisation.address || '14 Rue Saint-Ferréol, 13001 Marseille');
  const [phone, setPhone] = useState(organisation.phone || '04 91 00 20 30');
  const [orgEmail, setOrgEmail] = useState(organisation.email || 'contact@atelier-restanques.fr');
  const [vatMode, setVatMode] = useState<VatMode>(organisation.vat_mode || 'exempt');
  const [vatNumber, setVatNumber] = useState(organisation.vat_number || '');
  const [vatCustomMention, setVatCustomMention] = useState(
    organisation.vat_custom_mention || 'TVA non applicable, art. 293 B du CGI'
  );
  const [paylibPhone, setPaylibPhone] = useState(organisation.paylib_phone || '06 12 34 56 78');
  const [paypalMeLink, setPaypalMeLink] = useState(
    organisation.paypal_me_link || 'https://paypal.me/AtelierRestanques'
  );
  const [previewQrType, setPreviewQrType] = useState<'paylib' | 'paypal'>('paylib');
  const [resendApiKey, setResendApiKey] = useState(organisation.resend_api_key || '');
  const [resendFromEmail, setResendFromEmail] = useState(organisation.resend_from_email || '');
  const [fullName, setFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExportBackup = () => {
    const backupData = {
      export_date: new Date().toISOString(),
      organisation: localStorage.getItem('craft_org') ? JSON.parse(localStorage.getItem('craft_org')!) : null,
      suppliers: localStorage.getItem('craft_suppliers') ? JSON.parse(localStorage.getItem('craft_suppliers')!) : [],
      raw_materials: localStorage.getItem('craft_raw_materials') ? JSON.parse(localStorage.getItem('craft_raw_materials')!) : [],
      recipes: localStorage.getItem('craft_recipes') ? JSON.parse(localStorage.getItem('craft_recipes')!) : [],
      products: localStorage.getItem('craft_products') ? JSON.parse(localStorage.getItem('craft_products')!) : [],
      batches: localStorage.getItem('craft_batches') ? JSON.parse(localStorage.getItem('craft_batches')!) : [],
      sales: localStorage.getItem('craft_sales') ? JSON.parse(localStorage.getItem('craft_sales')!) : [],
      expenses: localStorage.getItem('craft_expenses') ? JSON.parse(localStorage.getItem('craft_expenses')!) : [],
      clients: localStorage.getItem('craft_clients') ? JSON.parse(localStorage.getItem('craft_clients')!) : [],
      orders: localStorage.getItem('craft_orders') ? JSON.parse(localStorage.getItem('craft_orders')!) : [],
      cleaning_logs: localStorage.getItem('craft_cleaning_logs') ? JSON.parse(localStorage.getItem('craft_cleaning_logs')!) : [],
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sauvegarde_CraftManager_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadQrCode = async () => {
    try {
      const qrData =
        previewQrType === 'paylib'
          ? `tel:${paylibPhone.replace(/\s+/g, '')}`
          : paypalMeLink;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(qrData)}`;
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `QRCode_${previewQrType === 'paylib' ? 'Paylib_Wero' : 'PayPal'}_${name.replace(/\s+/g, '_')}.png`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error('Error downloading QR code:', e);
    }
  };

  useEffect(() => {
    setName(organisation.name || "L'Atelier des Restanques");
    setCraftType(organisation.craft_type || 'savonnerie');
    setCurrency(organisation.currency || 'EUR');
    setSiret(organisation.siret || '892 341 590 00012');
    setAddress(organisation.address || '14 Rue Saint-Ferréol, 13001 Marseille');
    setPhone(organisation.phone || '04 91 00 20 30');
    setOrgEmail(organisation.email || 'contact@atelier-restanques.fr');
    setVatMode(organisation.vat_mode || 'exempt');
    setVatNumber(organisation.vat_number || '');
    setVatCustomMention(
      organisation.vat_custom_mention || 'TVA non applicable, art. 293 B du CGI'
    );
    setPaylibPhone(organisation.paylib_phone || '06 12 34 56 78');
    setPaypalMeLink(
      organisation.paypal_me_link || 'https://paypal.me/AtelierRestanques'
    );
    setResendApiKey(organisation.resend_api_key || '');
    setResendFromEmail(organisation.resend_from_email || '');

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email || '');
        if (data.user.user_metadata?.full_name) {
          setFullName(data.user.user_metadata.full_name);
        }
      }
    });
  }, [organisation, isOpen]);

  if (!isOpen) return null;

  const handleVatModeChange = (mode: VatMode) => {
    setVatMode(mode);
    if (mode === 'exempt') {
      setVatCustomMention('TVA non applicable, art. 293 B du CGI');
    } else if (mode === '20') {
      setVatCustomMention('TVA appliquée au taux normal de 20%');
    } else if (mode === '10') {
      setVatCustomMention('TVA appliquée au taux intermédiaire de 10%');
    } else if (mode === '5.5') {
      setVatCustomMention('TVA appliquée au taux réduit de 5.5%');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);

    try {
      await updateOrganisation({
        name,
        craft_type: craftType,
        currency,
        siret,
        address,
        phone,
        email: orgEmail,
        vat_mode: vatMode,
        vat_number: vatNumber,
        vat_custom_mention: vatCustomMention,
        paylib_phone: paylibPhone,
        paypal_me_link: paypalMeLink,
        resend_api_key: resendApiKey,
        resend_from_email: resendFromEmail,
      });

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({
          data: { full_name: fullName, organisation_name: name, craft_type: craftType, currency },
        });
      }

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Sticky Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold border border-amber-300">
              <Store className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Mon Atelier & Profil</h2>
              <p className="text-[11px] font-semibold text-slate-500">Personnalisez votre activité & coordonnées</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
            {/* Feedback Banner */}
            {savedSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-emerald-900 font-bold animate-in fade-in duration-200 shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Modifications de l'Atelier enregistrées avec succès !</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nom de votre Savonnerie / Atelier *</label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input w-full text-slate-900 font-semibold"
                  style={{ paddingLeft: '2.75rem' }}
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nom & Prénom de l'Artisan(e)</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="glass-input w-full text-slate-900 font-semibold"
                  style={{ paddingLeft: '2.75rem' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Spécialité Artisanale</label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={craftType}
                    onChange={(e) => setCraftType(e.target.value as CraftType)}
                    className="glass-input w-full text-slate-900 font-semibold cursor-pointer"
                    style={{ paddingLeft: '2.75rem' }}
                  >
                    <option value="savonnerie">🧼 Savonnerie à froid</option>
                    <option value="bougies">🕯️ Bougies & Parfums</option>
                    <option value="ceramique">🏺 Céramique & Poterie</option>
                    <option value="couture">🧵 Couture & Textile</option>
                    <option value="bijouterie">💎 Bijouterie & Joaillerie</option>
                    <option value="apiculture">🐝 Apiculture & Miel</option>
                    <option value="autre">🎨 Autre Création</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Devise Principale</label>
                <div className="relative">
                  <Coins className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="glass-input w-full text-slate-900 font-semibold cursor-pointer"
                    style={{ paddingLeft: '2.75rem' }}
                  >
                    <option value="EUR">€ Euro (EUR)</option>
                    <option value="CHF">CHF Franc Suisse</option>
                    <option value="CAD">$ Dollar Canadien</option>
                    <option value="GBP">£ Livre Sterling</option>
                    <option value="USD">$ Dollar US</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Legal & VAT Details Section for Invoices */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <FileText className="w-4 h-4 text-indigo-600" />
                Coordonnées Légales & TVA (Pour les Factures)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">N° SIREN / SIRET</label>
                  <div className="relative">
                    <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={siret}
                      onChange={(e) => setSiret(e.target.value)}
                      placeholder="ex: 892 341 590 00012"
                      className="glass-input w-full font-mono text-xs"
                      style={{ paddingLeft: '2.25rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Téléphone Atelier</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="ex: 04 91 00 20 30"
                      className="glass-input w-full text-xs"
                      style={{ paddingLeft: '2.25rem' }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Adresse Complète de l'Atelier</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="ex: 14 Rue Saint-Ferréol, 13001 Marseille"
                    className="glass-input w-full text-xs font-medium"
                    style={{ paddingLeft: '2.25rem' }}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Email Pro Atelier (sur Facture)</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                    placeholder="ex: contact@atelier.fr"
                    className="glass-input w-full text-xs font-mono"
                    style={{ paddingLeft: '2.25rem' }}
                  />
                </div>
              </div>

              {/* VAT Mode Selection */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2.5">
                <label className="block font-bold text-indigo-950 text-[11px]">Régime TVA sur vos Factures :</label>
                <select
                  value={vatMode}
                  onChange={(e) => handleVatModeChange(e.target.value as VatMode)}
                  className="glass-input w-full text-xs font-bold bg-white text-slate-900"
                >
                  <option value="exempt">🟢 Non-assujetti / Exonéré (TVA non applicable, art. 293 B du CGI)</option>
                  <option value="20">🔵 TVA 20% (Taux normal)</option>
                  <option value="10">🟣 TVA 10% (Taux intermédiaire)</option>
                  <option value="5.5">🟡 TVA 5,5% (Taux réduit)</option>
                  <option value="custom">✏️ Mention spécifique sur mesure</option>
                </select>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Mention Légale affichée au bas de la facture :
                  </label>
                  <input
                    type="text"
                    value={vatCustomMention}
                    onChange={(e) => setVatCustomMention(e.target.value)}
                    placeholder="ex: TVA non applicable, art. 293 B du CGI"
                    className="glass-input w-full text-xs font-semibold bg-white"
                  />
                </div>

                {vatMode !== 'exempt' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      N° TVA Intracommunautaire (optionnel) :
                    </label>
                    <input
                      type="text"
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                      placeholder="ex: FR 32 892341590"
                      className="glass-input w-full text-xs font-mono bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Paylib / Wero & PayPal QR Payments Section with Live Preview & Download */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  📱 Paiements QR Code (Paylib / Wero / PayPal)
                </h3>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                  Prêt pour le stand & marché
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">N° Téléphone Paylib / Wero</label>
                  <input
                    type="text"
                    value={paylibPhone}
                    onChange={(e) => setPaylibPhone(e.target.value)}
                    placeholder="ex: 06 12 34 56 78"
                    className="glass-input w-full font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Lien / Pseudo PayPal.me</label>
                  <input
                    type="text"
                    value={paypalMeLink}
                    onChange={(e) => setPaypalMeLink(e.target.value)}
                    placeholder="ex: https://paypal.me/VotreAtelier"
                    className="glass-input w-full font-semibold"
                  />
                </div>
              </div>

              {/* QR Code Live Preview & 1-Click Download Card */}
              <div className="bg-purple-50/80 border border-purple-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-purple-700" />
                    Aperçu & Téléchargement du QR Code Stand
                  </span>
                  <div className="flex bg-white rounded-lg p-0.5 border border-purple-200 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPreviewQrType('paylib')}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                        previewQrType === 'paylib' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-purple-700'
                      }`}
                    >
                      Paylib / Wero
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewQrType('paypal')}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                        previewQrType === 'paypal' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-purple-700'
                      }`}
                    >
                      PayPal
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-purple-100">
                  <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs shrink-0 flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        previewQrType === 'paylib'
                          ? `tel:${paylibPhone.replace(/\s+/g, '')}`
                          : paypalMeLink
                      )}`}
                      alt={`QR Code ${previewQrType}`}
                      className="w-24 h-24 object-contain rounded-lg"
                    />
                  </div>
                  <div className="space-y-2 text-left flex-1 w-full">
                    <p className="text-xs font-extrabold text-slate-900">
                      {previewQrType === 'paylib' ? `QR Paylib : ${paylibPhone}` : `QR PayPal.me : ${paypalMeLink}`}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Vos clients peuvent scanner ce QR code avec leur téléphone pour vous régler instantanément.
                    </p>
                    <button
                      type="button"
                      onClick={handleDownloadQrCode}
                      className="w-full sm:w-auto px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>📥 Télécharger le QR Code (.PNG)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Safety & 1-Click Backup Export */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs flex items-center gap-1.5 text-indigo-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Sauvegarde & Sécurité des Données (1-Clic)
                </span>
                <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full">
                  Redondance Cloud + Local
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Téléchargez l'intégralité de vos données d'atelier (recettes, fournitures, fournées, factures, registre hygiène) dans un fichier de sauvegarde réexploitable.
              </p>
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>💾 Télécharger la Sauvegarde Complète de l'Atelier (.json)</span>
              </button>
            </div>

            {/* Import Traceability Document Section (Strictly restricted to savonneriecyaness@gmail.com) */}
            {userEmail.toLowerCase() === 'savonneriecyaness@gmail.com' && (
              <div className="pt-3 border-t border-slate-100">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-amber-950 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                      Importation Traçabilité Atelier
                    </span>
                    <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                      55 Lots détectés
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Importer l'historique complet de votre fabrication (55 fournées, 23 formules, 49 ingrédients & 16 fournisseurs).
                  </p>
                  <button
                    type="button"
                    disabled={importing}
                    onClick={async () => {
                      setImporting(true);
                      const ok = await importTraceabilitySeed();
                      setImporting(false);
                      if (ok) {
                        setSavedSuccess(true);
                        setTimeout(() => {
                          setSavedSuccess(false);
                          onClose();
                        }, 1500);
                      }
                    }}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl font-black text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    {importing ? 'Importation des 55 lots en cours...' : '📥 Importer l\'Historique de Traçabilité'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Footer with Save and Cancel always accessible */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/95 backdrop-blur-xs shrink-0 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition cursor-pointer text-xs"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black shadow-md flex items-center gap-2 transition cursor-pointer text-xs active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Enregistrement...' : 'Enregistrer les Modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
