"use client";

import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { DemoNoticeBanner } from '../components/common/DemoNoticeBanner';
import { StatCard } from '../components/dashboard/StatCard';
import { LeadInflowChart } from '../components/dashboard/LeadInflowChart';
import { LeadDistributionChart } from '../components/dashboard/LeadDistributionChart';
import { ContactSourceChart } from '../components/dashboard/ContactSourceChart';
import { RecentActivities } from '../components/dashboard/RecentActivities';
import { PriorityLeads } from '../components/dashboard/PriorityLeads';
import { DASHBOARD_METRICS } from '../data/mockData';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Demonstration Data Banner */}
        <DemoNoticeBanner />

        {/* 6 Metric KPI Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DASHBOARD_METRICS.map((metric) => (
            <StatCard key={metric.id} data={metric} />
          ))}
        </div>

        {/* Demonstration Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Inflow Chart (2 Cols on Desktop) */}
          <div className="lg:col-span-2">
            <LeadInflowChart />
          </div>

          {/* Classification Distribution (1 Col) */}
          <div className="lg:col-span-1">
            <LeadDistributionChart />
          </div>
        </div>

        {/* Contact Sources & Recent Activities Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ContactSourceChart />
          <RecentActivities />
        </div>

        {/* Priority Leads Table Card */}
        <PriorityLeads />
      </div>
    </DashboardLayout>
  );
}
