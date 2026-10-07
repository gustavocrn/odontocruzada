"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ModulePlaceholder } from '../../components/common/ModulePlaceholder';
import { LeadBadge } from '../../components/common/LeadBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { NewLeadModal } from '../../components/leads/NewLeadModal';
import { leadService } from '../../services/leadService';
import { Lead, LeadClassification, LeadStatus, LeadSource, PurchaseTimeline } from '../../types';
import {
  Users,
  Search,
  Filter,
  Kanban,
  List,
  Plus,
  Phone,
  Building,
  Calendar,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Home
} from 'lucide-react';

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [activeTab, setActiveTab] = useState<'todos' | LeadClassification>('todos');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'todos'>('todos');
  const [sourceFilter, setSourceFilter] = useState<string>('todos');
  const [timelineFilter, setTimelineFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Modal State
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    const data = await leadService.getLeads({
      search: searchTerm,
      classification: activeTab,
      status: statusFilter,
      source: sourceFilter,
      timeline: timelineFilter
    });
    setLeads(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, [activeTab, statusFilter, sourceFilter, timelineFilter, searchTerm]);

  const features = [
    {
      title: 'Filtros Dinâmicos Combinados',
      description: 'Filtragem avançada por nome, telefone, temperatura (Quente/Morno), status de atendimento, origem e prazo de compra.',
      status: 'pronto_ui' as const
    },
    {
      title: 'Conexão Supabase / PostgreSQL',
      description: 'Arquitetura com suporte a sincronização via Supabase SDK com fallback para armazenamento local.',
      status: 'pronto_ui' as const
    },
    {
      title: 'Ficha Completa do Comprador',
      description: 'Abertura da página detalhada /leads/[id] com perfil do imóvel procurado, qualificação financeira e auditoria de atividades.',
      status: 'pronto_ui' as const
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <ModulePlaceholder
          title="Gestão de Leads & Compradores"
          description="Central de prospecção e cadastro do corretor Gustavo Carneiro (CRECI 52321) em Ponta Grossa/PR."
          icon={Users}
          moduleBadge="Etapa 2 — CRM Funcional"
          features={features}
        >
          {/* Main Visual Leads Interface */}
          <div className="space-y-4">
            {/* Action Bar Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              {/* Category Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                {[
                  { id: 'todos', label: 'Todos os Leads' },
                  { id: 'quente', label: '🔥 Quentes' },
                  { id: 'morno', label: '🟡 Mornos' },
                  { id: 'planejamento', label: '🔵 Em Planejamento' },
                  { id: 'nao_classificado', label: '⚪ Não Classificados' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                      activeTab === tab.id
                        ? 'bg-navy-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* View Switcher & Add Button */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-medium">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${
                      viewMode === 'list' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    <List size={14} /> Lista
                  </button>
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${
                      viewMode === 'kanban' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    <Kanban size={14} /> Kanban
                  </button>
                </div>

                <button
                  onClick={() => setIsNewLeadModalOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-700 shadow-sm transition-all"
                >
                  <Plus size={16} />
                  <span>+ Novo Lead</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
              {/* Search Bar */}
              <div className="relative w-full lg:w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por Nome ou Telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-hidden"
                />
              </div>

              {/* Dropdown Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700"
                >
                  <option value="todos">Status: Todos</option>
                  <option value="Novo">Novo</option>
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
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700"
                >
                  <option value="todos">Origem: Todas</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Indicação">Indicação</option>
                  <option value="Cadastro manual">Cadastro manual</option>
                  <option value="Site">Site</option>
                </select>

                <select
                  value={timelineFilter}
                  onChange={(e) => setTimelineFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700"
                >
                  <option value="todos">Prazo: Todos</option>
                  <option value="Imediatamente">Imediatamente</option>
                  <option value="Até 30 dias">Até 30 dias</option>
                  <option value="1 a 3 meses">1 a 3 meses</option>
                  <option value="3 a 6 meses">3 a 6 meses</option>
                </select>

                <span className="text-xs text-slate-500 font-bold ml-auto">
                  {leads.length} {leads.length === 1 ? 'lead' : 'leads'}
                </span>
              </div>
            </div>

            {/* Content Table / Kanban */}
            {viewMode === 'list' ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase">
                        <th className="py-3 px-3">Lead / Telefone</th>
                        <th className="py-3 px-3">Imóvel Procurado</th>
                        <th className="py-3 px-3">Entrada Informada</th>
                        <th className="py-3 px-3">Origem</th>
                        <th className="py-3 px-3">Temperatura</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 font-bold text-white text-xs">
                                {lead.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{lead.name}</p>
                                <p className="text-[11px] text-slate-400">{lead.phone}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 font-medium text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <Home size={13} className="text-slate-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{lead.demand.propertyType} - {lead.demand.city}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 font-bold text-slate-900">
                            R$ {lead.financial.downPaymentAmount.toLocaleString('pt-BR')}
                          </td>

                          <td className="py-3.5 px-3 font-medium text-slate-500">
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-700">
                              {lead.source}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <LeadBadge classification={lead.classification} size="sm" />
                          </td>

                          <td className="py-3.5 px-3">
                            <StatusBadge status={lead.status} size="sm" />
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={() => router.push(`/leads/${lead.id}`)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:border-brand-500 hover:text-brand-600 shadow-2xs transition-colors"
                            >
                              Ver Ficha
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Kanban View */
              <div className="grid gap-4 md:grid-cols-4">
                {['quente', 'morno', 'planejamento', 'nao_classificado'].map((key) => {
                  const items = leads.filter(l => l.classification === key);
                  return (
                    <div key={key} className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3">
                      <div className="mb-3 flex items-center justify-between pb-2 border-b border-slate-200">
                        <LeadBadge classification={key as any} size="sm" />
                        <span className="text-xs font-bold text-slate-500">{items.length}</span>
                      </div>

                      <div className="space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => router.push(`/leads/${item.id}`)}
                            className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs hover:border-brand-400 cursor-pointer transition-all"
                          >
                            <p className="font-bold text-xs text-slate-900">{item.name}</p>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{item.demand.propertyType}</p>
                            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                              <StatusBadge status={item.status} size="sm" />
                              <span className="text-brand-600 font-bold">Ver Ficha →</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ModulePlaceholder>

        <NewLeadModal
          isOpen={isNewLeadModalOpen}
          onClose={() => setIsNewLeadModalOpen(false)}
          onSuccess={fetchLeads}
        />
      </div>
    </DashboardLayout>
  );
}
