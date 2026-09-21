'use client';

import { useState } from 'react';
import { Payment } from '@/types/database.types';
import { createPaymentAction, confirmPaymentAction } from '@/app/actions/payments';
import { CreditCard, Loader2, DollarSign, CheckCircle2 } from 'lucide-react';

interface PaymentsSectionProps {
  projectId: string;
  clientId: string;
  proposalId?: string;
  payments: Payment[];
  isAdmin: boolean;
}

export function PaymentsSection({ projectId, clientId, proposalId, payments, isAdmin }: PaymentsSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);

  const handleCreatePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createPaymentAction(new FormData(e.currentTarget));
      setShowNewForm(false);
    } catch (err) {
      alert('Error al registrar pago');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPayment = async (paymentId: string) => {
    if (!confirm('¿Estás seguro de confirmar este pago? Esto podría activar el mantenimiento si el proyecto ya fue completado.')) return;
    setIsSubmitting(true);
    try {
      await confirmPaymentAction(paymentId, projectId, clientId);
    } catch (err) {
      alert('Error al confirmar pago');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalConfirmed = payments.filter(p => p.status === 'Confirmado').reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-400" />
          Pagos
        </h3>
        {!showNewForm && (
          <button onClick={() => setShowNewForm(true)} className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded">
            + Registrar Pago
          </button>
        )}
      </div>

      {showNewForm && (
        <form onSubmit={handleCreatePayment} className="p-4 bg-slate-800/30 border-b border-slate-800 space-y-3">
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="client_id" value={clientId} />
          {proposalId && <input type="hidden" name="proposal_id" value={proposalId} />}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input type="number" step="0.01" name="amount" required placeholder="Monto" className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white" />
            <select name="currency" className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white" required>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="COP">COP</option>
              <option value="MXN">MXN</option>
            </select>
            <select name="payment_type" className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white" required>
              <option value="Anticipo">Anticipo</option>
              <option value="Hito">Hito</option>
              <option value="Saldo final">Saldo final</option>
              <option value="Único">Pago Único</option>
            </select>
            <input type="date" name="payment_date" required className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input name="payment_method" placeholder="Método (Ej. Transferencia)" className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white" />
            <input name="reference" placeholder="Ref/Transacción" className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowNewForm(false)} className="text-xs text-slate-400 hover:text-white px-3 py-1.5">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded flex items-center">
              {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null} Registrar
            </button>
          </div>
        </form>
      )}

      <div className="p-0">
        {payments.length === 0 ? (
          <p className="text-xs text-slate-500 p-6 text-center">No hay pagos registrados para este proyecto.</p>
        ) : (
          <div>
            <div className="p-3 bg-emerald-900/20 border-b border-emerald-900/50 flex justify-between items-center text-xs">
              <span className="text-emerald-500 font-semibold uppercase tracking-wider">Total Confirmado</span>
              <span className="text-emerald-400 font-bold text-lg">${totalConfirmed.toLocaleString()}</span>
            </div>
            <div className="divide-y divide-slate-800/50">
              {payments.map((payment) => (
                <div key={payment.id} className="p-4 hover:bg-slate-800/20 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      <strong className="text-sm text-slate-200">${payment.amount.toLocaleString()} {payment.currency}</strong>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded uppercase">{payment.payment_type}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Fecha: {new Date(payment.payment_date || '').toLocaleDateString()}
                      {payment.payment_method && ` • Método: ${payment.payment_method}`}
                      {payment.reference && ` • Ref: ${payment.reference}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded ${
                      payment.status === 'Confirmado' ? 'bg-emerald-900/50 text-emerald-400' :
                      payment.status === 'Registrado' ? 'bg-amber-900/50 text-amber-400' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {payment.status}
                    </span>
                    
                    {isAdmin && payment.status === 'Registrado' && (
                      <button 
                        onClick={() => handleConfirmPayment(payment.id)}
                        disabled={isSubmitting}
                        className="text-[10px] flex items-center bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" /> Confirmar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
