"use client";

import React, { useState } from 'react';
import { Lead, LeadSource, LeadClassification, LeadStatus, PurchaseTimeline, PurchaseForm, CreditStatus } from '../../types';
import { leadService } from '../../services/leadService';
import { X, Edit3, Save, User, Phone, Mail, DollarSign, Home, Compass, ShieldCheck } from 'lucide-react';

interface EditLeadModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Lead) => void;
}

export const EditLeadModal: React.FC<EditLeadModalProps> = ({ lead, isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState(lead.name);
  const [phone, setPhone] = useState(lead.phone);
  const [email, setEmail] = useState(lead.email || '');
  const [source, setSource] = useState<LeadSource>(lead.source);
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [classification, setClassification] = useState<LeadClassification>(lead.classification);
  const [purchaseTimeline, setPurchaseTimeline] = useState<PurchaseTimeline>(lead.purchaseTimeline);
  
  // Demand
  const [propertyType, setPropertyType] = useState(lead.demand.propertyType);
  const [city, setCity] = useState(lead.demand.city || 'Ponta Grossa');
  const [bedrooms, setBedrooms] = useState(lead.demand.bedrooms || 3);
  const [parkingSpaces, setParkingSpaces] = useState(lead.demand.parkingSpaces || 2);
  const [minPrice, setMinPrice] = useState(lead.demand.minPrice || 0);
  const [maxPrice, setMaxPrice] = useState(lead.demand.maxPrice || 800000);

  // Financial
  const [purchaseForm, setPurchaseForm] = useState<PurchaseForm>(lead.financial.purchaseForm);
  const [downPaymentAmount, setDownPaymentAmount] = useState(lead.financial.downPaymentAmount || 0);
  const [fgtsAmount, setFgtsAmount] = useState(lead.financial.fgtsAmount || 0);
  const [fgtsStatus, setFgtsStatus] = useState(lead.financial.fgtsStatus || 'Não informado');
  const [hasVehicle, setHasVehicle] = useState(lead.financial.hasVehicleOrAsset || false);
  const [assetDescription, setAssetDescription] = useState(lead.financial.assetDescription || '');
  const [assetAmount, setAssetAmount] = useState(lead.financial.assetAmount || 0);
  
  // Credit
  const [creditStatus, setCreditStatus] = useState<CreditStatus>(lead.financial.creditStatus);
  const [bankInstitution, setBankInstitution] = useState(lead.financial.bankInstitution || '');
  const [approvedAmount, setApprovedAmount] = useState(lead.financial.approvedAmount || 0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const updated = await leadService.updateLead(lead.id, {
        name,
        phone,
        email,
        source,
        status,
        classification,
        purchaseTimeline,
        demand: {
          ...lead.demand,
          propertyType,
          city,
          bedrooms: Number(bedrooms),
          parkingSpaces: Number(parkingSpaces),
          minPrice: Number(minPrice),
          maxPrice: Number(maxPrice)
        },
        financial: {
          ...lead.financial,
          purchaseForm,
          hasDownPayment: Number(downPaymentAmount) > 0,
          downPaymentAmount: Number(downPaymentAmount),
          hasFGTS: Number(fgtsAmount) > 0,
          fgtsAmount: Number(fgtsAmount),
          fgtsStatus: Number(fgtsAmount) > 0 ? 'Informado' : fgtsStatus,
          hasVehicleOrAsset: hasVehicle,
          assetDescription,
          assetAmount: Number(assetAmount),
          creditStatus,
          bankInstitution,
          approvedAmount: Number(approvedAmount)
        }
      });

      if (updated) {
        onSuccess(updated);
        onClose();
      }
    } catch (err) {
      setError('Erro ao atualizar lead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-navy-900 p-2 text-brand-300">
              <Edit3 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Editar Ficha do Lead: {lead.name}</h3>
              <p className="text-xs text-slate-500">Atualize as informações comerciais e financeiras</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          {/* Section 1: Personal & Operational Status */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-brand-700">1. Dados Pessoais & Atendimento</h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Status de Atendimento</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LeadStatus)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
                >
                  <option value="Novo">Novo</option>
                  <option value="Em atendimento">Em atendimento</option>
                  <option value="Qualificando">Qualificando</option>
                  <option value="Qualificado">Qualificado</option>
                  <option value="Aguardando cliente">Aguardando cliente</option>
                  <option value="Aguardando corretor">Aguardando corretor</option>
                  <option value="Visita agendada">Visita agendada</option>
                  <option value="Negociação">Negociação</option>
                  <option value="Convertido">Convertido</option>
                  <option value="Perdido">Perdido</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Classificação (Temperatura)</label>
                <select
                  value={classification}
                  onChange={(e) => setClassification(e.target.value as LeadClassification)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
                >
                  <option value="quente">🔥 Quente</option>
                  <option value="morno">🟡 Morno</option>
                  <option value="planejamento">🔵 Planejamento</option>
                  <option value="nao_classificado">⚪ Não Classificado</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Prazo de Compra</label>
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

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Origem do Lead</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as LeadSource)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
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
          </div>

          {/* Section 2: Property Demand */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-brand-700">2. Necessidade Imobiliária (Ponta Grossa/PR)</h4>
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo de Imóvel</label>
                <input
                  type="text"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Cidade</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Faixa Mínima (R$)</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Faixa Máxima (R$)</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Financial Qualification */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-brand-700">3. Qualificação Financeira</h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Forma de Compra</label>
                <select
                  value={purchaseForm}
                  onChange={(e) => setPurchaseForm(e.target.value as PurchaseForm)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
                >
                  <option value="À vista">À vista</option>
                  <option value="Financiamento">Financiamento</option>
                  <option value="Financiamento + recursos próprios">Financiamento + recursos próprios</option>
                  <option value="Ainda não sabe">Ainda não sabe</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Valor da Entrada (R$)</label>
                <input
                  type="number"
                  value={downPaymentAmount}
                  onChange={(e) => setDownPaymentAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Valor do FGTS (R$)</label>
                <input
                  type="number"
                  value={fgtsAmount}
                  onChange={(e) => setFgtsAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Situação do Crédito Bancário</label>
                <select
                  value={creditStatus}
                  onChange={(e) => setCreditStatus(e.target.value as CreditStatus)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
                >
                  <option value="Não analisado">Não analisado</option>
                  <option value="Pretende analisar">Pretende analisar</option>
                  <option value="Em análise">Em análise</option>
                  <option value="Pré-aprovado">Pré-aprovado</option>
                  <option value="Aprovado">Aprovado</option>
                  <option value="Não aprovado">Não aprovado</option>
                  <option value="Não informado">Não informado</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Banco / Instituição</label>
                <input
                  type="text"
                  value={bankInstitution}
                  onChange={(e) => setBankInstitution(e.target.value)}
                  placeholder="Ex: Itaú, Caixa, Sicoob"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Valor de Crédito Aprovado (R$)</label>
                <input
                  type="number"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
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
              className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white hover:bg-brand-700 shadow-sm disabled:opacity-50"
            >
              <Save size={15} />
              <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
