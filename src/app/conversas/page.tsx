"use client";

import React, { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ModulePlaceholder } from '../../components/common/ModulePlaceholder';
import { LeadBadge } from '../../components/common/LeadBadge';
import { MOCK_CONVERSATIONS } from '../../data/mockData';
import {
  MessageSquare,
  Send,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  CheckCheck,
  Building,
  User,
  Bot
} from 'lucide-react';

export default function ConversasPage() {
  const [selectedChat, setSelectedChat] = useState(MOCK_CONVERSATIONS[0]);
  const [messageInput, setMessageInput] = useState('');

  const features = [
    {
      title: 'Integração Nativa com WhatsApp Web API',
      description: 'Estrutura visual configurada para conectar a API Oficial ou Baileys para disparo e recebimento em tempo real.',
      status: 'pronto_ui' as const
    },
    {
      title: 'Assistente SDR de Resposta Automática',
      description: 'Painel visual de mensagens enviadas pela IA SDR durante o primeiro contato com novos clientes.',
      status: 'proxima_etapa' as const
    },
    {
      title: 'Envio de Fichas de Imóveis & PDFs',
      description: 'Ações preparadas para anexar lâminas digitais, tabelas de valores e plantões de vendas diretamente na conversa.',
      status: 'pronto_ui' as const
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <ModulePlaceholder
          title="Central de Conversas & WhatsApp"
          description="Interface unificada de comunicação para acompanhamento de diálogos com clientes."
          icon={MessageSquare}
          moduleBadge="Módulo de Conversas"
          features={features}
        >
          {/* WhatsApp Web Style Mock Chat Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-2xl border border-slate-200/80 bg-white shadow-card overflow-hidden h-[600px]">
            {/* Left Sidebar: Conversations List */}
            <div className="lg:col-span-4 border-r border-slate-200/80 flex flex-col bg-slate-50/50">
              <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <MessageSquare size={16} className="text-emerald-600" />
                  Conversas Recentes
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  3 Ativas
                </span>
              </div>

              <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
                {MOCK_CONVERSATIONS.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                      selectedChat.id === chat.id
                        ? 'bg-white shadow-2xs border-l-4 border-l-brand-600'
                        : 'hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 font-bold text-white text-xs">
                        {chat.avatar}
                      </div>
                      {chat.status === 'online' && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-xs text-slate-900 truncate">{chat.contactName}</p>
                        <span className="text-[10px] text-slate-400 font-medium">{chat.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{chat.lastMessage}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <LeadBadge classification={chat.classification} size="sm" />
                        {chat.unread > 0 && (
                          <span className="rounded-full bg-brand-600 text-white text-[10px] font-bold h-4 min-w-4 flex items-center justify-center px-1">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Middle Column: Chat Window */}
            <div className="lg:col-span-8 flex flex-col bg-slate-50/20">
              {/* Active Chat Header */}
              <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 font-bold text-white text-xs">
                    {selectedChat.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{selectedChat.contactName}</h4>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      ● Atendimento Ativo
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-400">
                  <button className="p-2 hover:bg-slate-100 rounded-lg" onClick={() => alert("Chamada visual de teste.")}>
                    <Phone size={16} />
                  </button>
                  <button className="p-2 hover:bg-slate-100 rounded-lg" onClick={() => alert("Reunião por vídeo visual de teste.")}>
                    <Video size={16} />
                  </button>
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                <div className="text-center my-2">
                  <span className="bg-white/80 border border-slate-200/60 text-slate-500 text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-2xs">
                    Início da conversa via WhatsApp SDR
                  </span>
                </div>

                {selectedChat.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'sdr' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs ${
                        msg.sender === 'sdr'
                          ? 'bg-navy-900 text-white rounded-br-none'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                          msg.sender === 'sdr' ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        <span>{msg.time}</span>
                        {msg.sender === 'sdr' && <CheckCheck size={12} className="text-brand-300" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
                <button
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg border border-slate-200"
                  onClick={() => alert("Anexar arquivo visual — Ativado na integração de mídia.")}
                >
                  <Paperclip size={16} />
                </button>

                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Simulação de resposta ao WhatsApp..."
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-brand-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && messageInput.trim()) {
                      alert(`Mensagem simulada enviada: "${messageInput}". A sincronização real em tempo real será ativada com o backend WhatsApp.`);
                      setMessageInput('');
                    }
                  }}
                />

                <button
                  onClick={() => {
                    if (messageInput.trim()) {
                      alert(`Mensagem simulada enviada: "${messageInput}". A sincronização real em tempo real será ativada com o backend WhatsApp.`);
                      setMessageInput('');
                    } else {
                      alert("Digite uma mensagem para simular o envio.");
                    }
                  }}
                  className="rounded-xl bg-brand-600 p-2.5 text-white hover:bg-brand-700 shadow-sm"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </ModulePlaceholder>
      </div>
    </DashboardLayout>
  );
}
