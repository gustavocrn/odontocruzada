"use client";

import React from 'react';
import { MetricCardData } from '../../types';
import { LeadBadge } from '../common/LeadBadge';
import {
  Users,
  Sparkles,
  Flame,
  ThermometerSun,
  Compass,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';

interface StatCardProps {
  data: MetricCardData;
}

export const StatCard: React.FC<StatCardProps> = ({ data }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Users':
        return Users;
      case 'Sparkles':
        return Sparkles;
      case 'Flame':
        return Flame;
      case 'ThermometerSun':
        return ThermometerSun;
      case 'Compass':
        return Compass;
      case 'CheckCircle2':
        return CheckCircle2;
      default:
        return Users;
    }
  };

  const IconComponent = getIcon(data.iconName);

  const cardBorderColors: Record<string, string> = {
    total: 'hover:border-blue-300 border-slate-200/80',
    novo: 'hover:border-blue-400 border-blue-100 bg-gradient-to-b from-blue-50/20 to-white',
    quente: 'hover:border-rose-400 border-rose-100 bg-gradient-to-b from-rose-50/20 to-white',
    morno: 'hover:border-amber-400 border-amber-100 bg-gradient-to-b from-amber-50/20 to-white',
    planejamento: 'hover:border-purple-400 border-purple-100 bg-gradient-to-b from-purple-50/20 to-white',
    qualificado: 'hover:border-emerald-400 border-emerald-100 bg-gradient-to-b from-emerald-50/20 to-white',
    nao_classificado: 'hover:border-slate-300 border-slate-200'
  };

  const cardKey = data.classification || 'total';

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
        cardBorderColors[cardKey] || 'border-slate-200/80'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {data.title}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {data.value}
            </span>
          </div>
        </div>

        {/* Icon Container */}
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-navy-900 group-hover:text-brand-300">
          <IconComponent size={22} />
        </div>
      </div>

      {/* Footer Info & Classification Badge */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
          <TrendingUp size={13} />
          <span>{data.change}</span>
        </div>

        {data.classification && (
          <LeadBadge classification={data.classification} size="sm" />
        )}
      </div>
    </div>
  );
};
