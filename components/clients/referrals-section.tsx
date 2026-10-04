'use client';

import { useState } from 'react';
import { Referral, ReferralStatus } from '@/types/database.types';
import { createReferralAction, updateReferralStatusAction } from '@/app/actions/retention-referrals';
import {
  Share2,
  Plus,
  Loader2,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  Gift,
} from 'lucide-react';

interface ReferralsSectionProps {
  clientId: string;
  referrals: Referral[];
}

export function ReferralsSection({ clientId, referrals }: ReferralsSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [incentiveAuthorized, setIncentiveAuthorized] = useState(false);
  const [incentiveDetails, setIncentiveDetails] = useState('');
  const [followupNotes, setFollowupNotes] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await createReferralAction({
        referrer_client_id: clientId,
        referred_name: name,
        referred_company: company,
        referred_phone: phone,
        referred_email: email,
        incentive_authorized: incentiveAuthorized,
        incentive_details: incentiveDetails,
        followup_notes: followupNotes,
      });
      if (res.success) {
        setName('');
        setCompany('');
        setPhone('');
        setEmail('');
        setIncentiveAuthorized(false);
        setIncentiveDetails('');
        setFollowupNotes('');
        setShowAddForm(false);
      } else {
        alert('Error: ' + res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (referralId: string, newStatus: ReferralStatus) => {
    try {
      await updateReferralStatusAction(referralId, newStatus);
    } catch {
      alert('Error al actualizar estado del referido');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-indigo-400" /> Red de Referidos & Alianzas
            </h3>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
              {referrals.length} Referidos
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Empresas y contactos recomendados por este cliente. Permite trazabilidad comercial e incentivos autorizados.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" /> Registrar Referido
        </button>
      </div>

      {/* Formulario Nuevo Referido */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Registrar Referido</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Nombre del Contacto *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej. Roberto Andrade"
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Empresa</label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Ej. Distribuidora Andina S.A."
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Teléfono / WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Ej. +593 99 123 4567"
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="roberto@andina.com"
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
              <input
                type="checkbox"
                checked={incentiveAuthorized}
                onChange={e => setIncentiveAuthorized(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-semibold flex items-center gap-1">
                <Gift className="w-3.5 h-3.5 text-amber-400" /> Aplica incentivo o comisión autorizada
              </span>
            </label>

            {incentiveAuthorized && (
              <input
                type="text"
                value={incentiveDetails}
                onChange={e => setIncentiveDetails(e.target.value)}
                placeholder="Detalle del incentivo (ej. 10% descuento en renovación / $100 bono)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            )}
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold">Notas de Contacto</label>
            <input
              type="text"
              value={followupNotes}
              onChange={e => setFollowupNotes(e.target.value)}
              placeholder="El cliente nos autorizó a contactarlo mencionando su recomendación..."
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Registrar Referido
            </button>
          </div>
        </form>
      )}

      {/* Lista de Referidos */}
      {referrals.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
          <Share2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">No hay referidos registrados para este cliente.</p>
          <p className="text-[11px] text-slate-500 mt-1">Registra aquí las recomendaciones y nuevos prospectos derivados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {referrals.map(r => (
            <div
              key={r.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white">{r.referred_name}</h4>
                  {r.referred_company && (
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
                      <Building className="w-3 h-3" /> {r.referred_company}
                    </span>
                  )}
                  {r.incentive_authorized && (
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded flex items-center gap-1">
                      <Gift className="w-3 h-3" /> Incentivo
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 mt-2">
                  {r.referred_phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" /> {r.referred_phone}
                    </span>
                  )}
                  {r.referred_email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-500" /> {r.referred_email}
                    </span>
                  )}
                  {r.incentive_details && (
                    <span className="text-amber-300">
                      <strong>Incentivo:</strong> {r.incentive_details}
                    </span>
                  )}
                </div>

                {r.followup_notes && (
                  <p className="text-[11px] text-slate-400 mt-1">{r.followup_notes}</p>
                )}
              </div>

              <div className="self-end sm:self-center">
                <select
                  value={r.status}
                  onChange={e => handleStatusChange(r.id, e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Registrado">Registrado</option>
                  <option value="En contacto">En contacto</option>
                  <option value="En negociación">En negociación</option>
                  <option value="Convertido a cliente">Convertido a cliente</option>
                  <option value="Descartado">Descartado</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
