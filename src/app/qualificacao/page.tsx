"use client";

import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LeadBadge } from '../../components/common/LeadBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { supabase } from '../../lib/supabase';
import { leadService } from '../../services/leadService';
import { processSDRTurn, evaluateFollowUpEligibility } from '../../services/sdr/qualificationEngine';
import {
  Lead,
  ConversationMessage,
  LeadClassification,
  LeadStatus,
  PropertyDemand,
  FinancialQualification
} from '../../types';
import { SDRMessageAnalysis } from '../../services/sdr/types';
import {
  Send,
  RotateCcw,
  Bot,
  User,
  AlertTriangle,
  Sparkles,
  Home,
  DollarSign,
  Brain,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Info,
  Clock,
  Layers,
  ChevronDown,
  UserX,
  Play,
  FastForward,
  RefreshCw,
  Calendar,
  Check
} from 'lucide-react';

export default function QualificacaoPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<{ isConfigured: boolean; message: string; providerName?: string }>({
    isConfigured: false,
    message: 'Verificando provedor de IA...'
  });
  const [analysis, setAnalysis] = useState<SDRMessageAnalysis | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [simulatedNow, setSimulatedNow] = useState<Date | null>(null);
  const [realTime, setRealTime] = useState<Date>(new Date());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Relógio do tempo real atualizando a cada 1s
  useEffect(() => {
    const timer = setInterval(() => setRealTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper para obter cabeçalho de autenticação do Supabase
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    }
    return headers;
  };

  // Carregar lista de leads e status de IA na montagem
  useEffect(() => {
    async function initData() {
      try {
        // Busca estritamente da tabela public.leads do Supabase real
        const loadedLeads = await leadService.getLeads();
        setLeads(loadedLeads);
        if (loadedLeads.length > 0) {
          setSelectedLead(loadedLeads[0]);
        } else {
          setSelectedLead(null);
        }

        // Verificar status da IA no backend com autenticação
        const headers = await getAuthHeaders();
        const res = await fetch('/api/sdr/simulate', { headers });
        const data = await res.json();
        if (data.aiStatus) {
          setAiStatus(data.aiStatus);
        }
      } catch (err: any) {
        console.error('Erro ao inicializar Simulador SDR:', err);
      }
    }

    initData();
  }, []);

  // Recalcula o diagnóstico determinístico do motor quando o relógio simulado ou o lead muda
  useEffect(() => {
    if (!selectedLead) {
      setAnalysis(null);
      setMessages([]);
      return;
    }

    setErrorMessage(null);

    const updatedAnalysis = processSDRTurn({
      lead: {
        id: selectedLead.id,
        name: selectedLead.name,
        status: selectedLead.status,
        cycleFollowupCount: selectedLead.cycleFollowupCount,
        totalFollowupCount: selectedLead.totalFollowupCount
      },
      demand: selectedLead.demand,
      financial: selectedLead.financial,
      purchaseTimeline: selectedLead.purchaseTimeline,
      newMessage: '',
      simulatedNow: simulatedNow || undefined
    });
    setAnalysis(updatedAnalysis);
  }, [selectedLead, simulatedNow]);

  // Executar Follow-up Elegível explicitamente através do botão de teste
  const handleExecuteFollowup = async () => {
    if (!selectedLead || loading) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/sdr/simulate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          leadId: selectedLead.id,
          action: 'execute_followup',
          simulatedNow: simulatedNow ? simulatedNow.toISOString() : undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.reason || data.error || 'Follow-up não executado (lead não elegível).');
        return;
      }

      if (data.analysis) setAnalysis(data.analysis);
      if (data.messages && Array.isArray(data.messages)) setMessages(data.messages);
      if (data.updatedLead) setSelectedLead(data.updatedLead);
    } catch (err: any) {
      setErrorMessage(`Erro ao executar follow-up: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Rolar chat para o final ao receber novas mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enviar mensagem do cliente para o simulador
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedLead || loading) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    setLoading(true);
    setErrorMessage(null);

    // Adiciona mensagem temporária do cliente à UI imediatamente
    const tempUserMsg: ConversationMessage = {
      id: crypto.randomUUID(),
      leadId: selectedLead.id,
      direction: 'inbound',
      senderType: 'lead',
      content: userText,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/sdr/simulate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          leadId: selectedLead.id,
          newMessage: userText
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorText = data.error || `Erro HTTP ${res.status}: Falha ao processar simulação.`;
        setErrorMessage(errorText);
        console.error('Erro na resposta do simulador:', errorText);
        return;
      }

      if (data.analysis) {
        setAnalysis(data.analysis);
      }

      if (data.lead) {
        setSelectedLead(data.lead);
      }

      if (data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages);
      } else if (data.aiReply) {
        const aiMsg: ConversationMessage = {
          id: crypto.randomUUID(),
          leadId: selectedLead.id,
          direction: 'outbound',
          senderType: 'ai',
          content: data.aiReply,
          createdAt: new Date().toISOString()
        };
        setMessages((prev) => [...prev, aiMsg]);
      }

      if (data.aiStatus) {
        setAiStatus(data.aiStatus);
      }
    } catch (err: any) {
      console.error('Erro de conexão no simulador:', err);
      setErrorMessage(`Erro de comunicação com o servidor: ${err.message || 'Falha na rede'}`);
    } finally {
      setLoading(false);
    }
  };

  // Selecionar imóvel do card interativo
  const handleSelectPropertyCard = async (propId: string, propTitle: string, propCode: string) => {
    if (!selectedLead || loading) return;
    setLoading(true);
    setErrorMessage(null);

    const userText = `Tenho interesse no imóvel ${propCode} (${propTitle})`;

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/sdr/simulate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          leadId: selectedLead.id,
          selectedPropertyId: propId,
          newMessage: userText
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Erro ao vincular imóvel.');
        return;
      }

      if (data.analysis) setAnalysis(data.analysis);
      if (data.lead) setSelectedLead(data.lead);
      if (data.messages && Array.isArray(data.messages)) setMessages(data.messages);
    } catch (err: any) {
      setErrorMessage(`Erro ao selecionar imóvel: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Reiniciar Simulação
  const handleResetSimulation = async () => {
    if (!selectedLead) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/sdr/simulate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          leadId: selectedLead.id,
          action: 'reset'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Erro ao reiniciar simulação.');
        return;
      }

      setMessages([]);
      setShowResetModal(false);

      // Reseta análise
      const resetAnalysis = processSDRTurn({
        lead: { id: selectedLead.id, name: selectedLead.name, status: 'Qualificando' },
        demand: { purpose: 'Moradia', propertyType: '', city: 'Ponta Grossa', regions: [], bedrooms: 0, needsSuite: false, parkingSpaces: 0, minPrice: 0, maxPrice: 0, keyFeatures: [] },
        financial: { purchaseForm: 'Ainda não sabe', hasDownPayment: false, downPaymentAmount: 0, intendsToIncreaseDownPayment: false, hasFGTS: false, intendsToUseFGTS: false, fgtsAmount: 0, fgtsStatus: 'Não informado', hasVehicleOrAsset: false, assetAmount: 0, hasSimulated: false, hasCreditAnalysis: false, creditStatus: 'Não informado', approvedAmount: 0 },
        newMessage: ''
      });
      setAnalysis(resetAnalysis);
    } catch (err: any) {
      console.error('Erro ao reiniciar simulação:', err);
      setErrorMessage(`Erro ao reiniciar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Formatadores de Valores
  const fmtMoney = (val?: number) => {
    if (!val || val <= 0) return 'Não informado';
    return `R$ ${val.toLocaleString('pt-BR')}`;
  };

  const fmtText = (val?: string) => {
    if (!val || !val.trim() || val === 'Não informado' || val === 'Ainda não sabe') return 'Não informado';
    return val;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
                Simulador SDR & Diagnóstico em Tempo Real
              </h1>
              <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700 border border-purple-200">
                Laboratório IA SDR
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Ambiente interno para testar diálogos contextuais e qualificação de leads do Supabase real.
            </p>
          </div>

          {/* Seletor de Lead Real do Supabase */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
            <User size={16} className="text-slate-400 ml-1" />
            {leads.length > 0 ? (
              <select
                value={selectedLead?.id || ''}
                onChange={(e) => {
                  const found = leads.find((l) => l.id === e.target.value);
                  if (found) setSelectedLead(found);
                }}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-2"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.phone})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-semibold text-slate-400 pr-2">Nenhum lead no Supabase</span>
            )}
          </div>
        </div>

        {/* Banner Status da IA */}
        <div
          className={`p-4 rounded-2xl border flex items-start sm:items-center justify-between gap-4 transition-all ${
            aiStatus.isConfigured
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                aiStatus.isConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {aiStatus.isConfigured ? <Sparkles size={18} /> : <AlertTriangle size={18} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider">
                  {aiStatus.isConfigured ? `IA Conectada (${aiStatus.providerName})` : 'Modo Determinístico (IA Desconectada)'}
                </span>
              </div>
              <p className="text-xs mt-0.5 opacity-90">{aiStatus.message}</p>
            </div>
          </div>

          {!aiStatus.isConfigured && (
            <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100/60 px-3 py-1.5 rounded-lg border border-amber-200">
              <Info size={14} />
              <span>Gera respostas automáticas via Motor SDR</span>
            </div>
          )}
        </div>

        {/* Mensagem de Erro Visual do Simulador */}
        {errorMessage && (
          <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 flex items-center justify-between gap-3 animate-fade-in shadow-2xs">
            <div className="flex items-center gap-2.5">
              <ShieldAlert size={18} className="text-rose-600 shrink-0" />
              <span className="text-xs font-semibold">{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer underline"
            >
              Fechar
            </button>
          </div>
        )}

        {/* ALERTA DE BANCO DE DADOS VAZIO */}
        {leads.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-8 text-center space-y-4 shadow-card">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <UserX size={24} />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-extrabold text-slate-900 text-base">Nenhum lead cadastrado no Supabase</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Não foram encontrados registros reais na tabela <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono text-[11px]">public.leads</code> do seu banco de dados Supabase.
              </p>
              <p className="text-xs text-slate-500 pt-1">
                Cadastre o primeiro lead na página de Leads do CRM ou insira um registro no painel do Supabase para iniciar o simulador.
              </p>
            </div>
          </div>
        ) : (
          /* Grid Principal (2 Colunas) */
          <div className="grid gap-6 lg:grid-cols-12">
            {/* LADO ESQUERDO: CHAT DO SIMULADOR (5 colunas) */}
            <div className="lg:col-span-5 flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-card overflow-hidden h-[720px]">
              {/* Header do Chat */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 font-extrabold text-white text-xs shadow-2xs">
                    {selectedLead?.name ? selectedLead.name.substring(0, 2).toUpperCase() : 'LD'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-tight">{selectedLead?.name || 'Selecione um Lead'}</h3>
                    <p className="text-[11px] text-slate-500">{selectedLead?.phone || 'Sem telefone'}</p>
                  </div>
                </div>

                {analysis && <LeadBadge classification={analysis.suggestedClassification} size="sm" />}
              </div>

              {/* Stream de Mensagens */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/40">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <div className="p-3 bg-slate-100 rounded-2xl mb-3">
                      <Bot size={28} className="text-slate-400" />
                    </div>
                    <h4 className="font-bold text-slate-700 text-xs">Simulador Pronto</h4>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-relaxed">
                      Digite uma mensagem como se você fosse o cliente (ex: "Procuro uma casa de 3 quartos em Ponta Grossa").
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isLead = msg.senderType === 'lead' || msg.direction === 'inbound';
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-2.5 ${isLead ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isLead ? 'bg-brand-600 text-white' : 'bg-navy-900 text-brand-300'
                          }`}
                        >
                          {isLead ? <User size={13} /> : <Bot size={13} />}
                        </div>

                        <div
                          className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed ${
                            isLead
                              ? 'bg-brand-600 text-white rounded-tr-none font-medium'
                              : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none font-normal'
                          }`}
                        >
                          <p className="whitespace-pre-line">{msg.content}</p>
                          <span
                            className={`mt-1 block text-[9px] font-semibold ${
                              isLead ? 'text-brand-100 text-right' : 'text-slate-400'
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                {/* SELETOR INTERATIVO DE ANÚNCIOS ATIVOS NO SIMULADOR */}
                {analysis?.nextPriorityField === 'selecionar_imovel_anuncio' && analysis.adProperties && analysis.adProperties.length > 0 && (
                  <div className="p-3 bg-purple-50/90 rounded-2xl border border-purple-200 space-y-2.5 my-2 animate-fade-in">
                    <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                      <Home size={16} className="text-purple-600 shrink-0" />
                      <span>Selecione qual imóvel você viu no anúncio:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {analysis.adProperties.map((prop) => (
                        <div
                          key={prop.id}
                          onClick={() => handleSelectPropertyCard(prop.id, prop.title, prop.propertyCode)}
                          className="p-2.5 rounded-xl bg-white border border-purple-200 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer flex gap-2.5 items-center group"
                        >
                          <img
                            src={prop.mainImageUrl || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'}
                            alt={prop.title}
                            className="w-12 h-12 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="bg-navy-900 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded font-mono block w-fit">
                              {prop.propertyCode}
                            </span>
                            <h4 className="font-bold text-slate-900 text-[11px] truncate mt-0.5 group-hover:text-purple-700">
                              {prop.title}
                            </h4>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {prop.neighborhood}, {prop.city}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {loading && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
                    <Bot size={16} className="animate-spin text-brand-600" />
                    <span>SDR processando e analisando resposta...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Formulário de Envio de Mensagem */}
              <div className="p-3 border-t border-slate-100 bg-white space-y-2">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Digite como se fosse o cliente..."
                    disabled={loading || !selectedLead}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={loading || !inputMessage.trim() || !selectedLead}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-all shadow-2xs shrink-0 cursor-pointer"
                  >
                    <Send size={15} />
                  </button>
                </form>

                {/* Botão de Limpar/Reiniciar */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    disabled={loading || messages.length === 0}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>Limpar / Reiniciar Simulação</span>
                  </button>

                  <span className="text-[10px] text-slate-400 font-medium">Laboratório SDR • Supabase Real</span>
                </div>
              </div>
            </div>

            {/* LADO DIREITO: PAINEL DE DIAGNÓSTICO EM TEMPO REAL (7 colunas) */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              {/* BLOCO DE TESTE DE TEMPO: RELÓGIO DO SIMULADOR */}
              <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-5 shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                  <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase tracking-wider">
                    <Clock size={18} className="text-purple-600" />
                    <span>Relógio do Simulador & Controle Temporal</span>
                  </div>

                  {/* Status de Elegibilidade */}
                  {selectedLead && evaluateFollowUpEligibility(selectedLead, simulatedNow || realTime).canSendAutomatedFollowup ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      🟢 Elegível Agora
                    </span>
                  ) : selectedLead?.scheduledFollowupAt && (simulatedNow || realTime) < new Date(selectedLead.scheduledFollowupAt) ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300 flex items-center gap-1.5">
                      <Clock size={12} className="text-amber-600" />
                      ⏳ Aguardando Agendamento
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-300 flex items-center gap-1.5">
                      ⛔ Retido / Não Elegível
                    </span>
                  )}
                </div>

                {/* Grid de Informações de Observabilidade */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-purple-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Horário Real Atual</span>
                    <span className="font-bold text-slate-800 font-mono text-[11px]">
                      {realTime.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })} - {realTime.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-purple-100">
                    <span className="text-[10px] text-purple-600 font-bold block">SimulatedNow (Tempo Simulado)</span>
                    <span className="font-extrabold text-purple-900 font-mono text-[11px]">
                      {simulatedNow
                        ? `${simulatedNow.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })} - ${simulatedNow.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`
                        : 'Tempo Real (Inativo)'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-purple-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Próxima Ação (next_action)</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {selectedLead?.nextAction || analysis?.suggestedNextAction || 'aguardar_cliente'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-purple-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Campo Faltante (nextPriorityField)</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {analysis?.nextPriorityField || 'Nenhum'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-purple-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Agendado (scheduled_followup_at)</span>
                    <span className="font-bold text-brand-700 font-mono text-[11px] block truncate">
                      {selectedLead?.scheduledFollowupAt
                        ? `${new Date(selectedLead.scheduledFollowupAt).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })} - ${new Date(selectedLead.scheduledFollowupAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`
                        : 'Nenhum agendamento'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-purple-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Período (scheduled_period)</span>
                    <span className="font-bold text-slate-800 uppercase text-[10px]">
                      {selectedLead?.scheduledPeriod || 'Não informado'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-purple-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">ID do Ciclo</span>
                    <span className="font-mono text-[10px] text-slate-700 font-bold truncate block">
                      {selectedLead?.followupCycleId || 'default'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-purple-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Contador do Ciclo</span>
                    <span className="font-bold text-slate-800">
                      {selectedLead?.cycleFollowupCount ?? 0} / 2 no ciclo
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-purple-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Total de Follow-ups</span>
                    <span className="font-bold text-slate-800">
                      {selectedLead?.totalFollowupCount ?? 0} disparos
                    </span>
                  </div>
                </div>

                {/* Motivo do Estado de Elegibilidade */}
                {selectedLead && (
                  <div className="p-2.5 rounded-xl bg-white/80 border border-purple-200 text-xs text-purple-950 font-medium leading-relaxed">
                    <strong className="font-bold text-purple-900">Motivo do Motor: </strong>
                    {evaluateFollowUpEligibility(selectedLead, simulatedNow || realTime).reason}
                  </div>
                )}

                {/* Controles de Avanço Temporal */}
                <div className="space-y-2 pt-1 border-t border-purple-100">
                  <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                    Controles de Avanço no Tempo (Apenas para Teste)
                  </span>

                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => setSimulatedNow(new Date((simulatedNow || realTime).getTime() + 30 * 60 * 1000))}
                      className="px-3 py-1.5 rounded-xl bg-white border border-purple-300 text-purple-900 font-bold text-xs hover:bg-purple-100 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <FastForward size={13} className="text-purple-600" />
                      <span>+30 min</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSimulatedNow(new Date((simulatedNow || realTime).getTime() + 24 * 60 * 60 * 1000))}
                      className="px-3 py-1.5 rounded-xl bg-white border border-purple-300 text-purple-900 font-bold text-xs hover:bg-purple-100 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <FastForward size={13} className="text-purple-600" />
                      <span>+24h</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSimulatedNow(new Date((simulatedNow || realTime).getTime() + 7 * 24 * 60 * 60 * 1000))}
                      className="px-3 py-1.5 rounded-xl bg-white border border-purple-300 text-purple-900 font-bold text-xs hover:bg-purple-100 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <FastForward size={13} className="text-purple-600" />
                      <span>+7 dias</span>
                    </button>

                    <button
                      type="button"
                      disabled={!selectedLead?.scheduledFollowupAt}
                      onClick={() => {
                        if (selectedLead?.scheduledFollowupAt) {
                          setSimulatedNow(new Date(selectedLead.scheduledFollowupAt));
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Calendar size={13} />
                      <span>Ir para horário agendado</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSimulatedNow(null)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-all flex items-center gap-1 cursor-pointer ml-auto"
                    >
                      <RefreshCw size={12} />
                      <span>Voltar ao tempo real</span>
                    </button>
                  </div>
                </div>

                {/* BOTÃO DE EXECUÇÃO MANUAL DO FOLLOW-UP */}
                <div className="pt-2 border-t border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleExecuteFollowup}
                    disabled={loading || !selectedLead || !evaluateFollowUpEligibility(selectedLead, simulatedNow || realTime).canSendAutomatedFollowup}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <Play size={14} className="fill-white" />
                    <span>Executar Follow-up Elegível</span>
                  </button>

                  <p className="text-[11px] text-purple-800 font-medium leading-tight">
                    * O disparo ocorre <strong>somente</strong> ao clicar neste botão. O avanço no tempo não envia mensagens sozinho.
                  </p>
                </div>
              </div>

              {/* Bloco 1: Perfil do Imóvel Procurado */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-navy-900 font-bold text-xs uppercase tracking-wider">
                    <Home size={16} className="text-brand-600" />
                    <span>Perfil do Imóvel Procurado</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Demanda Real</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Tipo de Imóvel</span>
                    <span className="font-bold text-slate-800">{fmtText(analysis?.updatedDemand.propertyType)}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Cidade</span>
                    <span className="font-bold text-slate-800">{fmtText(analysis?.updatedDemand.city)}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Quartos / Suíte</span>
                    <span className="font-bold text-slate-800">
                      {analysis?.updatedDemand.bedrooms ? `${analysis.updatedDemand.bedrooms} Qts` : 'Não informado'}
                      {analysis?.updatedDemand.needsSuite ? ' (Suíte)' : ''}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Orçamento Máximo</span>
                    <span className="font-bold text-brand-700">{fmtMoney(analysis?.updatedDemand.maxPrice)}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="text-[10px] text-slate-400 font-semibold block">Regiões / Bairros Preferenciais</span>
                  <span className="font-medium text-slate-700">
                    {analysis?.updatedDemand.regions && analysis.updatedDemand.regions.length > 0
                      ? analysis.updatedDemand.regions.join(', ')
                      : 'Não informado'}
                  </span>
                </div>
              </div>

              {/* Bloco 2: Qualificação Financeira */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-navy-900 font-bold text-xs uppercase tracking-wider">
                    <DollarSign size={16} className="text-emerald-600" />
                    <span>Qualificação Financeira & Crédito</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Capacidade Financeira</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Forma de Pagamento</span>
                    <span className="font-bold text-slate-800">{fmtText(analysis?.updatedFinancial.purchaseForm)}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Valor da Entrada</span>
                    <span className="font-bold text-emerald-700">{fmtMoney(analysis?.updatedFinancial.downPaymentAmount)}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Situação do Crédito</span>
                    <span className="font-bold text-purple-700">{fmtText(analysis?.updatedFinancial.creditStatus)}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Valor Aprovado</span>
                    <span className="font-bold text-slate-800">{fmtMoney(analysis?.updatedFinancial.approvedAmount)}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Uso de FGTS</span>
                    <span className="font-bold text-slate-800">
                      {analysis?.updatedFinancial.hasFGTS ? fmtMoney(analysis.updatedFinancial.fgtsAmount) : 'Não informado'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Prazo de Compra</span>
                    <span className="font-bold text-slate-800">{fmtText(analysis?.updatedTimeline)}</span>
                  </div>
                </div>
              </div>

              {/* Bloco 3: Diagnóstico SDR & Decisão Lógica */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-navy-900 font-bold text-xs uppercase tracking-wider">
                    <Brain size={16} className="text-purple-600" />
                    <span>Diagnóstico do Motor SDR</span>
                  </div>
                  {analysis && <StatusBadge status={analysis.suggestedStatus} />}
                </div>

                {/* Status de Intervenção Humana */}
                {analysis?.requiresHumanIntervention && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2.5 text-xs font-semibold">
                    <ShieldAlert size={16} className="text-rose-600 shrink-0" />
                    <span>Requer Intervenção Humana: Encaminhar este lead para atendimento direto do corretor Gustavo Carneiro.</span>
                  </div>
                )}

                {/* Próximo Foco Prioritário */}
                <div className="p-3.5 rounded-xl bg-navy-900 text-white space-y-1">
                  <span className="text-[10px] font-bold text-brand-300 uppercase tracking-wider block flex items-center justify-between">
                    <span>Próxima Informação Prioritária</span>
                    <span className="text-[9px] font-mono font-normal text-slate-300">
                      Campo: {analysis?.nextPriorityField}
                    </span>
                  </span>
                  <p className="text-xs font-semibold leading-relaxed text-slate-100">
                    {analysis?.nextQuestionFocus || 'Calculando próximo foco...'}
                  </p>
                </div>

                {/* Imóvel Atual em Discussão */}
                {analysis?.currentProperty && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Imóvel Atual em Discussão
                      </span>
                      <span className="bg-emerald-200 text-emerald-900 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
                        {analysis.currentProperty.propertyCode}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <img
                        src={analysis.currentProperty.mainImageUrl || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'}
                        alt={analysis.currentProperty.title}
                        className="w-14 h-14 rounded-lg object-cover shrink-0 border border-emerald-200"
                      />
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-900 text-xs">{analysis.currentProperty.title}</h4>
                        <p className="text-[11px] text-slate-600">
                          {analysis.currentProperty.neighborhood}, {analysis.currentProperty.city}
                        </p>
                        <p className="text-[11px] font-extrabold text-emerald-700">
                          {analysis.currentProperty.showPriceToCustomer && analysis.currentProperty.price > 0
                            ? `R$ ${analysis.currentProperty.price.toLocaleString('pt-BR')}`
                            : 'Valor sob consulta'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Objetivo Comercial Semântico (Orientação para IA) */}
                {analysis?.commercialObjective && (
                  <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 space-y-1">
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                      Objetivo Comercial (Orientação Semântica para IA)
                    </span>
                    <p className="text-xs text-purple-900 leading-relaxed font-medium">
                      {analysis.commercialObjective}
                    </p>
                  </div>
                )}

                {/* Justificativa da Classificação */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Justificativa da Classificação
                  </span>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                    {analysis?.decisionReason || 'Carregando justificativa da regra...'}
                  </p>
                </div>

                {/* Lista de Campos Faltantes Ordenados por Prioridade */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Campos Faltantes (Prioridade de Pergunta)
                  </span>
                  {analysis?.missingFields && analysis.missingFields.length > 0 ? (
                    <div className="space-y-1.5">
                      {analysis.missingFields.map((field, idx) => (
                        <div
                          key={field.field}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                              {idx + 1}
                            </span>
                            <span className="font-medium text-slate-700">{field.description}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Prioridade {field.priority}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 p-2 bg-emerald-50 rounded-lg">
                      <CheckCircle2 size={14} />
                      <span>Qualificação completa! Todas as informações principais foram capturadas.</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmação para Limpar/Reiniciar */}
      {showResetModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <RotateCcw size={20} />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Reiniciar Simulação?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja realmente limpar o histórico de conversas do simulador e redefinir a qualificação do lead <strong className="text-slate-900">{selectedLead.name}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetSimulation}
                className="px-4 py-2 rounded-xl bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700 transition-colors cursor-pointer shadow-2xs"
              >
                Confirmar Reinício
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
