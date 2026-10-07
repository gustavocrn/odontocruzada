"use client";

import React from 'react';
import { LeadClassification } from '../../types';
import { Flame, ThermometerSun, Compass, HelpCircle } from 'lucide-react';

interface LeadBadgeProps {
  classification: LeadClassification;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LeadBadge: React.FC<LeadBadgeProps> = ({
  classification,
  showIcon = true,
  size = 'md',
  className = ''
}) => {
  const config = {
    quente: {
      label: '🔥 Quente',
      bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
      icon: Flame
    },
    morno: {
      label: '🟡 Morno',
      bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
      icon: ThermometerSun
    },
    planejamento: {
      label: '🔵 Planejamento',
      bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
      icon: Compass
    },
    nao_classificado: {
      label: '⚪ Não Classificado',
      bg: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: HelpCircle
    }
  };

  const item = config[classification] || config.nao_classificado;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-semibold',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold'
  };

  return (
    <span className={`inline-flex items-center rounded-full border shadow-2xs transition-colors ${item.bg} ${sizeClasses[size]} ${className}`}>
      <span>{item.label}</span>
    </span>
  );
};
