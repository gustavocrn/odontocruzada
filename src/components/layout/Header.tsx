"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Bell,
  Menu,
  User,
  Sparkles,
  ChevronDown,
  Building2,
  CheckCircle2,
  LogOut
} from 'lucide-react';
import { BROKER_INFO } from '../../data/mockData';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getPageTitle = (path: string | null) => {
    if (path?.startsWith('/leads/')) {
      return { title: 'Ficha do Comprador', subtitle: 'Qualificação completa do lead, necessidade imobiliária e financeiro' };
    }

    switch (path) {
      case '/':
      case '/dashboard':
        return { title: 'Dashboard Principal', subtitle: 'Funil comercial e indicadores de prospecção de imóveis' };
      case '/leads':
        return { title: 'Gestão de Leads & Compradores', subtitle: 'Cadastro, busca e qualificação individual de clientes' };
      case '/funil':
        return { title: 'Funil de Vendas', subtitle: 'Visualização Kanban por status de atendimento' };
      case '/tarefas':
        return { title: 'Tarefas & Follow-ups', subtitle: 'Agendamento de ligações, retornos e visitas' };
      case '/conversas':
        return { title: 'Conversas & WhatsApp', subtitle: 'Atendimento unificado via mensagens' };
      case '/qualificacao':
        return { title: 'Qualificação SDR', subtitle: 'Matriz BANT e regras de classificação de crédito' };
      case '/agendamentos':
        return { title: 'Agendamentos & Visitas', subtitle: 'Agenda de compromissos presenciais e reuniões' };
      case '/relatorios':
        return { title: 'Relatórios & Desempenho', subtitle: 'Funil de conversão comercial' };
      case '/configuracoes':
        return { title: 'Configurações do Sistema', subtitle: 'Perfil do corretor, Supabase e parâmetros' };
      default:
        return { title: 'GC SDR Imobiliário', subtitle: 'Inteligência Imobiliária para Gustavo Carneiro' };
    }
  };

  const { title, subtitle } = getPageTitle(pathname);

  const notifications = [
    { id: '1', text: 'Novo lead cadastrado: Dra. Camila Rocha (Vila Estrela)', time: 'Há 15 min', read: false },
    { id: '2', text: 'Financiamento em análise na Caixa: Eng. Marcos Paiva', time: 'Há 2h', read: false }
  ];

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Left section: Hamburger (mobile/tablet) & Page Titles */}
      <div className="flex items-center gap-4 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 lg:hidden focus:outline-hidden"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>

        <div className="flex flex-col min-w-0">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 truncate">
            {title}
          </h1>
          <p className="hidden sm:block text-xs font-medium text-slate-500 truncate">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right section: Search, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Visual Search Bar */}
        <div className="relative hidden md:block w-64 lg:w-80">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Buscar lead por nome ou telefone..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-12 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 transition-all"
            readOnly
            onClick={() => alert("Utilize o campo de busca funcional na tela de Gestão de Leads.")}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
              Ctrl K
            </kbd>
          </div>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative rounded-xl border p-2.5 transition-all ${
              showNotifications
                ? 'border-brand-500 bg-brand-50 text-brand-600'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            aria-label="Notificações"
          >
            <Bell size={19} />
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-dropdown z-50 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Bell size={16} className="text-brand-600" />
                  <span>Notificações SDR</span>
                </div>
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-700">
                  2 novas
                </span>
              </div>

              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl border bg-blue-50/50 border-blue-100 text-xs">
                    <p className="font-semibold text-slate-800">{n.text}</p>
                    <span className="text-[10px] text-slate-400 font-medium mt-1 block">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 hidden sm:block" />

        {/* User Profile Component */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 rounded-xl border border-slate-200 p-1.5 pr-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 font-bold text-white shadow-xs text-xs">
              GC
            </div>

            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900">{BROKER_INFO.name}</span>
              <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                <Building2 size={10} className="text-brand-600" /> CRECI {BROKER_INFO.creci}
              </span>
            </div>

            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-dropdown z-50 animate-fade-in">
              <div className="border-b border-slate-100 pb-2.5 mb-2 px-2">
                <p className="text-xs font-bold text-slate-900">{BROKER_INFO.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || BROKER_INFO.email}</p>
                <span className="mt-1.5 inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={10} /> Corretor de Imóveis (CRECI {BROKER_INFO.creci})
                </span>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    signOut();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut size={14} />
                  <span>Sair da Conta (Logout)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
