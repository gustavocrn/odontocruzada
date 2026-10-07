"use client";

import React from 'react';
import { LeadStatus } from '../../types';
import { Sparkles, MessageCircle, Filter, CheckCircle2, Clock, CalendarDays, Briefcase, Award, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: LeadStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = ''
}) => {
  const config: Record<LeadStatus, { label: string; bg: string; icon: any }> = {
    'Novo': {
      label: 'Novo',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Sparkles
    },
    'Em atendimento': {
      label: 'Em atendimento',
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: MessageCircle
    },
    'Qualificando': {
      label: 'Qualificando',
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: Filter
    },
    'Qualificado': {
      label: 'Qualificado',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2
    },
    'Aguardando cliente': {
      label: 'Aguardando cliente',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock
    },
    'Aguardando corretor': {
      label: 'Aguardando corretor',
      bg: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: Clock
    },
    'Visita agendada': {
      label: 'Visita agendada',
      bg: 'bg-teal-50 text-teal-700 border-teal-200',
      icon: CalendarDays
    },
    'Negociação': {
      label: 'Negociação',
      bg: 'bg-cyan-50 text-cyan-800 border-cyan-300',
      icon: Briefcase
    },
    'Convertido': {
      label: 'Convertido',
      bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      icon: Award
    },
    'Perdido': {
      label: 'Perdido',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: XCircle
    }
  };

  const item = config[status] || config['Novo'];
  const IconComponent = item.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1 font-semibold',
    md: 'px-2.5 py-1 text-xs gap-1.5 font-semibold',
    lg: 'px-3 py-1.5 text-sm gap-2 font-semibold'
  };

  return (
    <span className={`inline-flex items-center rounded-lg border shadow-2xs ${item.bg} ${sizeClasses[size]} ${className}`}>
      <IconComponent size={13} className="shrink-0" />
      <span>{item.label}</span>
    </span>
  );
};
