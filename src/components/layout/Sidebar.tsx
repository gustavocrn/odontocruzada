"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Filter,
  CalendarDays,
  BarChart3,
  Settings,
  Building2,
  X,
  ChevronRight,
  ShieldCheck,
  Kanban,
  CheckSquare,
  LogOut
} from 'lucide-react';
import { BROKER_INFO } from '../../data/mockData';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Leads', path: '/leads', icon: Users, badge: 5 },
    { label: 'Imóveis', path: '/imoveis', icon: Building2 },
    { label: 'Funil de Vendas', path: '/funil', icon: Kanban },
    { label: 'Tarefas & Follow-ups', path: '/tarefas', icon: CheckSquare, badge: 3 },
    { label: 'Conversas', path: '/conversas', icon: MessageSquare, badge: 2 },
    { label: 'Qualificação SDR', path: '/qualificacao', icon: Filter },
    { label: 'Agendamentos', path: '/agendamentos', icon: CalendarDays },
    { label: 'Relatórios', path: '/relatorios', icon: BarChart3 },
    { label: 'Configurações', path: '/configuracoes', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col bg-navy-900 text-slate-100 shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header / Logo Area */}
        <div className="flex h-20 items-center justify-between border-b border-slate-800/80 px-6">
          <Link href="/" className="flex items-center gap-3 group">
            {/* Logo Monogram Badge */}
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 font-extrabold text-white shadow-md shadow-brand-600/30 ring-1 ring-white/20">
              <Building2 size={22} className="text-white" />
              <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-navy-900" title="Sistema Online" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-brand-300 transition-colors">
                  GC SDR
                </span>
                <span className="rounded bg-brand-500/20 px-1.5 py-0.2 text-[10px] font-bold text-brand-300 border border-brand-400/30">
                  CRM
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium truncate max-w-[150px]">
                {BROKER_INFO.name}
              </span>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-navy-800 hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Official Logo Slot Notice */}
        <div className="mx-4 mt-3 rounded-xl border border-slate-800 bg-navy-950/60 p-2 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            Logo Oficial • {BROKER_INFO.city}
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-4 py-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path));

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'text-slate-300 hover:bg-navy-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={`transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? 'bg-white text-brand-700'
                          : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight size={14} className="text-white/80" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer / Broker Info Badge & Logout */}
        <div className="border-t border-slate-800/80 p-4 space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-navy-800/60 p-2.5 border border-slate-800/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/20 text-brand-400 font-bold border border-brand-500/30 text-xs">
                GC
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">{BROKER_INFO.name}</span>
                <span className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  <ShieldCheck size={10} className="text-emerald-400" /> CRECI {BROKER_INFO.creci}
                </span>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-950 hover:text-rose-300 transition-colors"
              title="Sair da Conta (Logout)"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
