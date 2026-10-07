"use client";

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { propertyService } from '../../services/propertyService';
import { Property, PropertyAvailabilityStatus } from '../../types';
import { supabase } from '../../lib/supabase';
import {
  Home,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Megaphone,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Tag,
  MapPin,
  Bed,
  Car,
  Bath,
  Edit2,
  AlertCircle
} from 'lucide-react';

export default function ImoveisPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyActiveAds, setOnlyActiveAds] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    propertyCode: '',
    title: '',
    propertyType: 'Casa',
    neighborhood: '',
    city: 'Ponta Grossa',
    price: 0,
    bedrooms: 2,
    suites: 1,
    parkingSpaces: 1,
    bathrooms: 2,
    description: '',
    keyFeatures: '',
    mainImageUrl: '',
    availabilityStatus: 'Disponível' as PropertyAvailabilityStatus,
    adActive: true,
    showPriceToCustomer: true
  });

  const loadProperties = async () => {
    setLoading(true);
    try {
      let client = null;
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          client = supabase;
        }
      }
      const data = await propertyService.getProperties(client);
      setProperties(data);
    } catch (err) {
      console.error('Erro ao carregar imóveis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const handleToggleAd = async (prop: Property) => {
    const newStatus = !prop.adActive;
    try {
      let client = null;
      if (supabase) client = supabase;
      await propertyService.toggleAdActive(prop.id, newStatus, client);
      setProperties((prev) =>
        prev.map((p) => (p.id === prop.id ? { ...p, adActive: newStatus } : p))
      );
    } catch (err) {
      console.error('Erro ao alterar status de anúncio:', err);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingProperty(null);
    setFormData({
      propertyCode: `CS-${Math.floor(100 + Math.random() * 900)}`,
      title: '',
      propertyType: 'Casa',
      neighborhood: '',
      city: 'Ponta Grossa',
      price: 0,
      bedrooms: 2,
      suites: 1,
      parkingSpaces: 1,
      bathrooms: 2,
      description: '',
      keyFeatures: 'Churrasqueira, Garagem Coberta',
      mainImageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
      availabilityStatus: 'Disponível',
      adActive: true,
      showPriceToCustomer: true
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (prop: Property) => {
    setEditingProperty(prop);
    setFormData({
      propertyCode: prop.propertyCode,
      title: prop.title,
      propertyType: prop.propertyType,
      neighborhood: prop.neighborhood,
      city: prop.city,
      price: prop.price,
      bedrooms: prop.bedrooms,
      suites: prop.suites,
      parkingSpaces: prop.parkingSpaces,
      bathrooms: prop.bathrooms,
      description: prop.description,
      keyFeatures: prop.keyFeatures.join(', '),
      mainImageUrl: prop.mainImageUrl || '',
      availabilityStatus: prop.availabilityStatus,
      adActive: prop.adActive,
      showPriceToCustomer: prop.showPriceToCustomer
    });
    setShowModal(true);
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProp: Property = {
      id: editingProperty ? editingProperty.id : `prop-${Date.now()}`,
      propertyCode: formData.propertyCode.trim().toUpperCase(),
      title: formData.title.trim() || 'Imóvel sem título',
      propertyType: formData.propertyType,
      neighborhood: formData.neighborhood.trim() || 'Centro',
      city: formData.city.trim() || 'Ponta Grossa',
      price: Number(formData.price) || 0,
      bedrooms: Number(formData.bedrooms) || 0,
      suites: Number(formData.suites) || 0,
      parkingSpaces: Number(formData.parkingSpaces) || 0,
      bathrooms: Number(formData.bathrooms) || 0,
      description: formData.description.trim(),
      keyFeatures: formData.keyFeatures.split(',').map((f) => f.trim()).filter(Boolean),
      mainImageUrl: formData.mainImageUrl.trim() || undefined,
      availabilityStatus: formData.availabilityStatus,
      adActive: formData.adActive,
      showPriceToCustomer: formData.showPriceToCustomer,
      createdAt: editingProperty ? editingProperty.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (supabase) {
      try {
        await supabase.from('properties').upsert({
          id: newProp.id.startsWith('prop-') ? undefined : newProp.id,
          property_code: newProp.propertyCode,
          title: newProp.title,
          property_type: newProp.propertyType,
          neighborhood: newProp.neighborhood,
          city: newProp.city,
          price: newProp.price,
          bedrooms: newProp.bedrooms,
          suites: newProp.suites,
          parking_spaces: newProp.parkingSpaces,
          bathrooms: newProp.bathrooms,
          description: newProp.description,
          key_features: newProp.keyFeatures,
          main_image_url: newProp.mainImageUrl,
          availability_status: newProp.availabilityStatus,
          ad_active: newProp.adActive,
          show_price_to_customer: newProp.showPriceToCustomer
        });
      } catch (err) {
        console.warn('Erro ao salvar imóvel no Supabase:', err);
      }
    }

    setProperties((prev) => {
      if (editingProperty) {
        return prev.map((p) => (p.id === newProp.id ? newProp : p));
      }
      return [newProp, ...prev];
    });

    setShowModal(false);
  };

  // Filtros aplicados
  const filteredProperties = properties.filter((p) => {
    // Filtro estrito de Anúncios Ativos
    if (onlyActiveAds && (!p.adActive || p.availabilityStatus !== 'Disponível')) {
      return false;
    }

    if (statusFilter !== 'todos' && p.availabilityStatus !== statusFilter) {
      return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchCode = p.propertyCode.toLowerCase().includes(term);
      const matchTitle = p.title.toLowerCase().includes(term);
      const matchNeigh = p.neighborhood.toLowerCase().includes(term);
      const matchType = p.propertyType.toLowerCase().includes(term);
      return matchCode || matchTitle || matchNeigh || matchType;
    }

    return true;
  });

  const getStatusBadge = (status: PropertyAvailabilityStatus) => {
    switch (status) {
      case 'Disponível':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Disponível</span>;
      case 'Reservado':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Reservado</span>;
      case 'Vendido':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Vendido</span>;
      case 'Inativo':
        return <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Inativo</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
                Gestão de Imóveis & Anúncios Ativos
              </h1>
              <span className="rounded-full bg-navy-100 px-2.5 py-0.5 text-xs font-bold text-navy-800 border border-navy-200">
                Integração SDR
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Cadastre imóveis e controle quais estão rodando em anúncios para identificação automática do SDR.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-700 transition-all shadow-2xs cursor-pointer"
          >
            <Plus size={16} />
            <span>Cadastrar Imóvel</span>
          </button>
        </div>

        {/* Filtros e Controles */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          {/* Busca por código ou título */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código (ex: CS-101), título, bairro..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle de Anúncios Ativos */}
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={onlyActiveAds}
                onChange={(e) => setOnlyActiveAds(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
              <Megaphone size={14} className={onlyActiveAds ? 'text-purple-600' : 'text-slate-400'} />
              <span className="text-xs font-bold text-slate-700">Somente Anúncios Ativos</span>
            </label>

            {/* Filtro por Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="Disponível">Disponível</option>
              <option value="Reservado">Reservado</option>
              <option value="Vendido">Vendido</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
        </div>

        {/* Informação da Regra de Anúncio */}
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center gap-2">
          <AlertCircle size={16} className="text-purple-600 shrink-0" />
          <span>
            <strong>Regra SDR:</strong> O assistente virtual apresenta como opção de anúncio SOMENTE imóveis marcados com <strong className="underline">Anúncio Ativo ON</strong> e status <strong className="underline">Disponível</strong>.
          </span>
        </div>

        {/* Grid de Imóveis */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Carregando catálogo de imóveis...</div>
        ) : filteredProperties.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <Home size={32} className="mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-600">Nenhum imóvel encontrado</p>
            <p className="text-[11px] text-slate-400">Tente ajustar os filtros de busca ou cadastre um novo imóvel.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProperties.map((prop) => {
              const isElegibleForSDR = prop.adActive && prop.availabilityStatus === 'Disponível';
              return (
                <div
                  key={prop.id}
                  className={`rounded-2xl bg-white border transition-all overflow-hidden flex flex-col shadow-card hover:shadow-card-hover ${
                    isElegibleForSDR ? 'border-purple-300 ring-2 ring-purple-100' : 'border-slate-200'
                  }`}
                >
                  {/* Foto Principal + Badges Overlay */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    <img
                      src={prop.mainImageUrl || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'}
                      alt={prop.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="bg-navy-900/90 backdrop-blur-xs text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg shadow-2xs font-mono">
                        {prop.propertyCode}
                      </span>
                      {getStatusBadge(prop.availabilityStatus)}
                    </div>

                    <div className="absolute top-2 right-2">
                      <button
                        onClick={() => handleToggleAd(prop)}
                        className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs shadow-2xs transition-all cursor-pointer ${
                          prop.adActive
                            ? 'bg-purple-600/90 text-white hover:bg-purple-700'
                            : 'bg-slate-800/70 text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        <Megaphone size={12} />
                        <span>{prop.adActive ? 'Anúncio ON' : 'Anúncio OFF'}</span>
                      </button>
                    </div>

                    {isElegibleForSDR && (
                      <div className="absolute bottom-2 left-2 bg-emerald-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                        ✓ Opção Elegível no SDR
                      </div>
                    )}
                  </div>

                  {/* Conteúdo do Card */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                        <span>{prop.propertyType}</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin size={12} />
                          {prop.neighborhood}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug">
                        {prop.title}
                      </h3>
                    </div>

                    {/* Especificações */}
                    <div className="grid grid-cols-3 gap-1 py-2 border-y border-slate-100 text-[11px] text-slate-600 text-center font-medium">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-400">Quartos</span>
                        <span className="font-bold text-slate-800">{prop.bedrooms} Qts</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-400">Suítes</span>
                        <span className="font-bold text-slate-800">{prop.suites} Suítes</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-400">Vagas</span>
                        <span className="font-bold text-slate-800">{prop.parkingSpaces} Vagas</span>
                      </div>
                    </div>

                    {/* Valor & Exibição */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Preço</span>
                        <span className="font-extrabold text-brand-700 text-sm">
                          {prop.price > 0 ? `R$ ${prop.price.toLocaleString('pt-BR')}` : 'Sob Consulta'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        {prop.showPriceToCustomer ? (
                          <>
                            <Eye size={12} className="text-emerald-600" />
                            <span>Preço Exposto</span>
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} className="text-amber-600" />
                            <span>Sob Consulta</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Botão de Edição */}
                    <button
                      onClick={() => handleOpenEditModal(prop)}
                      className="w-full mt-2 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit2 size={13} />
                      <span>Editar Detalhes</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Cadastro / Edição */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 my-8 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingProperty ? `Editar Imóvel (${editingProperty.propertyCode})` : 'Cadastrar Novo Imóvel'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProperty} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Código do Imóvel</label>
                  <input
                    type="text"
                    value={formData.propertyCode}
                    onChange={(e) => setFormData({ ...formData, propertyCode: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipo de Imóvel</label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Casa">Casa</option>
                    <option value="Sobrado">Sobrado</option>
                    <option value="Apartamento">Apartamento</option>
                    <option value="Terreno">Terreno</option>
                    <option value="Comercial">Comercial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Título do Anúncio</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Sobrado Moderno com Suíte na Vila Estrela"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Bairro</label>
                  <input
                    type="text"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    placeholder="Ex: Vila Estrela"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Valor de Venda (R$)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Quartos</label>
                  <input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Suítes</label>
                  <input
                    type="number"
                    value={formData.suites}
                    onChange={(e) => setFormData({ ...formData, suites: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Vagas Garagem</label>
                  <input
                    type="number"
                    value={formData.parkingSpaces}
                    onChange={(e) => setFormData({ ...formData, parkingSpaces: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">URL da Foto Principal</label>
                <input
                  type="text"
                  value={formData.mainImageUrl}
                  onChange={(e) => setFormData({ ...formData, mainImageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-none text-[11px]"
                />
              </div>

              {/* Status de Disponibilidade e Controles de Anúncio */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Status de Disponibilidade</label>
                    <select
                      value={formData.availabilityStatus}
                      onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value as PropertyAvailabilityStatus })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="Disponível">Disponível</option>
                      <option value="Reservado">Reservado</option>
                      <option value="Vendido">Vendido</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={formData.adActive}
                        onChange={(e) => setFormData({ ...formData, adActive: e.target.checked })}
                        className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <span className="font-bold text-purple-900">Anúncio Ativo ON</span>
                    </label>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showPriceToCustomer}
                    onChange={(e) => setFormData({ ...formData, showPriceToCustomer: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-700">Exibir preço diretamente ao cliente no SDR</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 font-bold text-white hover:bg-brand-700 transition-colors shadow-2xs cursor-pointer"
                >
                  {editingProperty ? 'Salvar Alterações' : 'Cadastrar Imóvel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
