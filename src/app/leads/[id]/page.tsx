"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { LeadBadge } from '../../../components/common/LeadBadge';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { EditLeadModal } from '../../../components/leads/EditLeadModal';
import { leadService } from '../../../services/leadService';
import { Lead, LeadStatus, LeadClassification } from '../../../types';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  Building,
  DollarSign,
  Edit3,
  Plus,
  MessageSquare,
  FileText,
  Activity,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Send,
  Home,
  Check,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params?.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resumo' | 'imovel' | 'financeiro' | 'conversas' | 'atividades' | 'anotacoes'>('resumo');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const fetchLead = async () => {
    if (!leadId) return;
    setLoading(true);
    const data = await leadService.getLeadById(leadId);
    setLead(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLead();
  }, [leadId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-xs text-slate-400 animate-pulse font-medium">Carregando ficha do lead...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <AlertCircle size={36} className="mx-auto text-amber-500 mb-2" />
          <h3 className="font-bold text-slate-900 text-base">Lead não encontrado</h3>
          <p className="text-xs text-slate-500 mt-1">O código informado não corresponde a nenhum cliente cadastrado.</p>
          <button
            onClick={() => router.push('/leads')}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2 text-xs font-bold text-white shadow-xs"
          >
            <ArrowLeft size={14} /> Voltar para Gestão de Leads
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate Buying Capacity (Capacidade de Compra)
  const downPayment = lead.financial.downPaymentAmount || 0;
  const fgts = lead.financial.fgtsAmount || 0;
  const asset = lead.financial.assetAmount || 0;
  const approvedCredit = lead.financial.approvedAmount || 0;

  const totalInformedCapacity = downPayment + fgts + asset + approvedCredit;
  const confirmedCapacity = lead.financial.creditStatus === 'Aprovado' ? approvedCredit + downPayment : downPayment;

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    setSavingNote(true);
    const updated = await leadService.addNote(lead.id, newNoteText);
    if (updated) {
      setLead(updated);
      setNewNoteText('');
    }
    setSavingNote(false);
  };

  const handleQuickStatusChange = async (newStatus: LeadStatus) => {
    const updated = await leadService.updateLead(lead.id, { status: newStatus });
    if (updated) setLead(updated);
  };

  const handleQuickClassificationChange = async (newClass: LeadClassification) => {
    const updated = await leadService.updateLead(lead.id, { classification: newClass });
    if (updated) setLead(updated);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Navigation Back Link */}
        <button
          onClick={() => router.push('/leads')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft size={14} /> Voltar para Lista de Leads
        </button>

        {/* Lead Header Card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-navy-900 font-extrabold text-white text-xl shadow-md">
                {lead.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{lead.name}</h1>
                  <LeadBadge classification={lead.classification} size="sm" />
                  <StatusBadge status={lead.status} size="sm" />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Phone size={13} className="text-slate-400" /> {lead.phone}
                  </span>
                  {lead.email && (
                    <span className="flex items-center gap-1">
                      <Mail size={13} className="text-slate-400" /> {lead.email}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar size={13} className="text-slate-400" /> Entrou em: {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                    Origem: {lead.source}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions & Quick Status Pickers */}
            <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
              <div className="flex items-center gap-2">
                <select
                  value={lead.status}
                  onChange={(e) => handleQuickStatusChange(e.target.value as LeadStatus)}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs font-bold text-slate-800 shadow-2xs"
                >
                  <option value="Novo">Status: Novo</option>
                  <option value="Em atendimento">Em atendimento</option>
                  <option value="Qualificando">Qualificando</option>
                  <option value="Qualificado">Qualificado</option>
                  <option value="Aguardando cliente">Aguardando cliente</option>
                  <option value="Visita agendada">Visita agendada</option>
                  <option value="Negociação">Negociação</option>
                  <option value="Convertido">Convertido</option>
                  <option value="Perdido">Perdido</option>
                </select>

                <select
                  value={lead.classification}
                  onChange={(e) => handleQuickClassificationChange(e.target.value as LeadClassification)}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs font-bold text-slate-800 shadow-2xs"
                >
                  <option value="quente">🔥 Quente</option>
                  <option value="morno">🟡 Morno</option>
                  <option value="planejamento">🔵 Planejamento</option>
                  <option value="nao_classificado">⚪ Não Classificado</option>
                </select>
              </div>

              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 shadow-sm transition-all"
              >
                <Edit3 size={14} />
                <span>Editar Lead</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm">
          {[
            { id: 'resumo', label: 'Resumo Geral', icon: FileText },
            { id: 'imovel', label: 'Perfil do Imóvel Procurado', icon: Home },
            { id: 'financeiro', label: 'Qualificação Financeira', icon: DollarSign },
            { id: 'conversas', label: 'Conversas WhatsApp', icon: MessageSquare },
            { id: 'atividades', label: `Atividades (${lead.activities?.length || 0})`, icon: Activity },
            { id: 'anotacoes', label: `Anotações (${lead.notes?.length || 0})`, icon: Edit3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: RESUMO */}
        {activeTab === 'resumo' && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Quick Summary Cards */}
            <div className="md:col-span-2 space-y-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Home size={16} className="text-brand-600" />
                  <span>O que o cliente procura em Ponta Grossa/PR</span>
                </h3>

                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block">Tipo de Imóvel:</span>
                    <span className="font-bold text-slate-800">{lead.demand.propertyType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Finalidade:</span>
                    <span className="font-bold text-slate-800">{lead.demand.purpose}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Bairros de Interesse:</span>
                    <span className="font-bold text-slate-800">{lead.demand.regions.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Faixa de Investimento:</span>
                    <span className="font-bold text-brand-700">
                      R$ {lead.demand.minPrice.toLocaleString('pt-BR')} a R$ {lead.demand.maxPrice.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Quick Overview */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <DollarSign size={16} className="text-emerald-600" />
                  <span>Resumo Financeiro & Compra</span>
                </h3>

                <div className="grid gap-3 sm:grid-cols-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block">Entrada Informada:</span>
                    <span className="font-bold text-slate-800">R$ {lead.financial.downPaymentAmount.toLocaleString('pt-BR')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">FGTS Informado:</span>
                    <span className="font-bold text-slate-800">R$ {lead.financial.fgtsAmount.toLocaleString('pt-BR')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Status do Crédito:</span>
                    <span className="font-bold text-slate-800">{lead.financial.creditStatus}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Column: Timeline & Next Action */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 text-brand-700">
                  Próxima Ação
                </h4>
                <p className="text-xs text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {lead.nextAction || 'Nenhuma próxima ação cadastrada.'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 text-slate-500">
                  Prazo de Compra Pretendido
                </h4>
                <span className="inline-block rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-800 border border-purple-200">
                  {lead.purchaseTimeline}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PERFIL DO IMÓVEL PROCURADO */}
        {activeTab === 'imovel' && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
              Perfil do Imóvel Procurado pelo Cliente
            </h3>

            <div className="grid gap-4 sm:grid-cols-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-semibold block">Cidade:</span>
                <span className="font-bold text-slate-900">{lead.demand.city}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-semibold block">Bairros de Interesse:</span>
                <span className="font-bold text-slate-900">{lead.demand.regions.join(', ')}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-semibold block">Tipo de Imóvel:</span>
                <span className="font-bold text-slate-900">{lead.demand.propertyType}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-semibold block">Mínimo de Quartos:</span>
                <span className="font-bold text-slate-900">{lead.demand.bedrooms} dormitórios</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-semibold block">Necessita Suíte?</span>
                <span className="font-bold text-slate-900">{lead.demand.needsSuite ? 'Sim' : 'Não'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-semibold block">Vagas de Garagem:</span>
                <span className="font-bold text-slate-900">{lead.demand.parkingSpaces} vagas</span>
              </div>
            </div>

            {lead.demand.keyFeatures && lead.demand.keyFeatures.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-700 block mb-2">Diferenciais Importantes:</span>
                <div className="flex flex-wrap gap-2">
                  {lead.demand.keyFeatures.map((feat, idx) => (
                    <span key={idx} className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                      ✓ {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FINANCEIRO & CAPACIDADE DE COMPRA */}
        {activeTab === 'financeiro' && (
          <div className="space-y-6">
            {/* SEÇÃO VISUAL: CAPACIDADE DE COMPRA CONSOLIDADA */}
            <div className="rounded-2xl border border-brand-200 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-slate-50 p-6 shadow-md">
              <div className="flex items-center justify-between border-b border-blue-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-brand-600" size={22} />
                  <h3 className="font-extrabold text-slate-900 text-base">Consolidação da Capacidade de Compra</h3>
                </div>
                <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-extrabold text-white shadow-2xs">
                  Análise Financeira SDR
                </span>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {/* Valor Informado pelo Cliente */}
                <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Valor Informado pelo Cliente
                  </span>
                  <p className="mt-1 text-2xl font-extrabold text-brand-700">
                    R$ {totalInformedCapacity.toLocaleString('pt-BR')}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Soma declarada: Entrada (R$ {downPayment.toLocaleString('pt-BR')}) + FGTS (R$ {fgts.toLocaleString('pt-BR')}) + Outros (R$ {asset.toLocaleString('pt-BR')}) + Crédito (R$ {approvedCredit.toLocaleString('pt-BR')})
                  </p>
                </div>

                {/* Valor Confirmado / Documentado */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                    Valor Confirmado / Documentado
                  </span>
                  <p className="mt-1 text-2xl font-extrabold text-emerald-700">
                    R$ {confirmedCapacity.toLocaleString('pt-BR')}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-800">
                    Comprovação documental validada por comprovante bancário ou carta de crédito.
                  </p>
                </div>
              </div>

              {/* Warning Banner */}
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-800 border border-amber-200">
                <ShieldAlert size={16} className="text-amber-600 shrink-0" />
                <span>
                  <strong>Aviso do Sistema:</strong> Estimativas próprias do cliente não constituem aprovação bancária garantida. Apenas cartas de crédito validadas pela instituição são consideradas documentadas.
                </span>
              </div>
            </div>

            {/* Financial Qualification Detailed Table */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card space-y-4">
              <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                Detalhamento dos Recursos Financeiros
              </h4>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-semibold block">Forma Pretendida:</span>
                  <span className="font-bold text-slate-900">{lead.financial.purchaseForm}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-semibold block">Valor de Entrada:</span>
                  <span className="font-bold text-slate-900">R$ {lead.financial.downPaymentAmount.toLocaleString('pt-BR')}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-semibold block">FGTS:</span>
                  <span className="font-bold text-slate-900">
                    {lead.financial.hasFGTS ? `R$ ${lead.financial.fgtsAmount.toLocaleString('pt-BR')}` : 'Não informado'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-semibold block">Outros Recursos (Veículo/Imóvel):</span>
                  <span className="font-bold text-slate-900">
                    {lead.financial.hasVehicleOrAsset ? `${lead.financial.assetDescription} (R$ ${lead.financial.assetAmount.toLocaleString('pt-BR')})` : 'Não possui'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-semibold block">Situação do Financiamento:</span>
                  <span className="font-bold text-brand-700">{lead.financial.creditStatus}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-semibold block">Banco / Instituição:</span>
                  <span className="font-bold text-slate-900">{lead.financial.bankInstitution || 'Não informado'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CONVERSAS */}
        {activeTab === 'conversas' && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card text-center py-12">
            <MessageSquare size={36} className="mx-auto text-slate-400 mb-2" />
            <h4 className="font-bold text-slate-800 text-sm">Histórico de Mensagens do WhatsApp</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Espaço reservado para o espelhamento do histórico de conversas via WhatsApp Web API (Etapa futura).
            </p>
          </div>
        )}

        {/* TAB 5: ATIVIDADES (TIMELINE) */}
        {activeTab === 'atividades' && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
            <h4 className="font-bold text-slate-900 text-sm mb-4 border-b border-slate-100 pb-3">
              Linha do Tempo & Histórico de Modificações (Auditoria)
            </h4>

            <div className="space-y-4">
              {lead.activities && lead.activities.length > 0 ? (
                lead.activities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 border-l-2 border-brand-500 pl-4 py-1">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{act.action}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-semibold">
                        <span>Por: {act.author}</span>
                        <span>•</span>
                        <span>{new Date(act.timestamp).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Nenhuma atividade registrada.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: ANOTAÇÕES */}
        {activeTab === 'anotacoes' && (
          <div className="space-y-4">
            <form onSubmit={handleAddNote} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
              <label className="block text-xs font-bold text-slate-800 mb-1">Adicionar Nova Anotação Manual</label>
              <textarea
                rows={3}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Escreva observações internas sobre a negociação..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-brand-500"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingNote || !newNoteText.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  <Send size={13} />
                  <span>Salvar Anotação</span>
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {lead.notes && lead.notes.length > 0 ? (
                lead.notes.map((note) => (
                  <div key={note.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">{note.content}</p>
                    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400 font-semibold">
                      <span>Registrado por: {note.author}</span>
                      <span>{new Date(note.timestamp).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-center text-xs text-slate-400">
                  Nenhuma anotação manual registrada ainda.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Lead Modal Component */}
        <EditLeadModal
          lead={lead}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={(updated) => setLead(updated)}
        />
      </div>
    </DashboardLayout>
  );
}
