"use client";

import React, { useState } from 'react';
import { LeadSource, LeadClassification, LeadStatus, PurchaseTimeline, PurchaseForm } from '../../types';
import { leadService } from '../../services/leadService';
import { X, UserPlus, Phone, User, Mail, DollarSign, Home, Compass } from 'lucide-react';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState<LeadSource>('Cadastro manual');
  const [propertyType, setPropertyType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [downPaymentAmount, setDownPaymentAmount] = useState('');
  const [purchaseTimeline, setPurchaseTimeline] = useState<PurchaseTimeline>('Não informado');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Nome e Telefone são campos obrigatórios.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const hasDemandInput = Boolean(propertyType.trim() || Number(minPrice) > 0 || Number(maxPrice) > 0);
      const hasFinancialInput = Boolean(Number(downPaymentAmount) > 0);

      await leadService.createLead({
        name,
        phone,
        email,
        source,
        status: 'Novo' as LeadStatus,
        classification: 'nao_classificado' as LeadClassification,
        purchaseTimeline,
        demand: hasDemandInput ? {
          purpose: 'Moradia',
          propertyType,
          city: 'Ponta Grossa',
          regions: [],
          bedrooms: 0,
          needsSuite: false,
          parkingSpaces: 0,
          minPrice: Number(minPrice) || 0,
          maxPrice: Number(maxPrice) || 0,
          keyFeatures: [],
          propertyNotes: notes
        } : undefined,
        financial: hasFinancialInput ? {
          purchaseForm: 'Financiamento' as PurchaseForm,
          hasDownPayment: true,
          downPaymentAmount: Number(downPaymentAmount) || 0,
          intendsToIncreaseDownPayment: false,
          hasFGTS: false,
          intendsToUseFGTS: false,
          fgtsAmount: 0,
          fgtsStatus: 'Não informado',
          hasVehicleOrAsset: false,
          assetAmount: 0,
          hasSimulated: false,
          hasCreditAnalysis: false,
          creditStatus: 'Não informado',
          approvedAmount: 0
        } : undefined
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError('Erro ao salvar lead. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-brand-600 p-2 text-white">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Cadastrar Novo Lead</h3>
              <p className="text-xs text-slate-500">Insira os dados iniciais do cliente prospecção</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Mandatory Personal Data */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome Completo <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Dra. Camila Rocha"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Telefone / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="(42) 99999-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">E-mail (Opcional)</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="cliente@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Origem do Lead</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800 focus:outline-hidden"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="Indicação">Indicação</option>
                <option value="Cadastro manual">Cadastro manual</option>
                <option value="Site">Site</option>
                <option value="Outro">Outro</option>
                <option value="Origem não identificada">Origem não identificada</option>
              </select>
            </div>
          </div>

          {/* Property Interest */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <Home size={14} className="text-brand-600" /> Imóvel Procurado (Ponta Grossa/PR)
            </h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tipo de Imóvel</label>
                <input
                  type="text"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  placeholder="Ex: Sobrado, Casa"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Valor Mínimo (R$)</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Valor Máximo (R$)</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Financial Down payment & Timeline */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Entrada Inicial Disponível (R$)</label>
              <input
                type="number"
                value={downPaymentAmount}
                onChange={(e) => setDownPaymentAmount(e.target.value)}
                placeholder="Ex: 100000"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Prazo para Compra</label>
              <select
                value={purchaseTimeline}
                onChange={(e) => setPurchaseTimeline(e.target.value as PurchaseTimeline)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
              >
                <option value="Imediatamente">Imediatamente</option>
                <option value="Até 30 dias">Até 30 dias</option>
                <option value="1 a 3 meses">1 a 3 meses</option>
                <option value="3 a 6 meses">3 a 6 meses</option>
                <option value="6 a 12 meses">6 a 12 meses</option>
                <option value="Mais de 12 meses">Mais de 12 meses</option>
                <option value="Apenas pesquisando">Apenas pesquisando</option>
                <option value="Não informado">Não informado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Observações do Lead</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preferências específicas ou histórico prévio..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white hover:bg-brand-700 shadow-sm disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Cadastrar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
