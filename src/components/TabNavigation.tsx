import React from 'react';
import { LayoutDashboard, Table, Building2, Target, TrendingUp } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="tab-bar">
      <div className={`tab-item ${activeTab === 'executive' ? 'active' : ''}`} onClick={() => setActiveTab('executive')}>
        <LayoutDashboard size={16} /> Dashboard Executivo
      </div>
      <div className={`tab-item ${activeTab === 'indicator' ? 'active' : ''}`} onClick={() => setActiveTab('indicator')}>
        <Table size={16} /> Análise por Indicador
      </div>
      <div className={`tab-item ${activeTab === 'facility' ? 'active' : ''}`} onClick={() => setActiveTab('facility')}>
        <Building2 size={16} /> Por Estabelecimento
      </div>
      <div className={`tab-item ${activeTab === 'strategy' ? 'active' : ''}`} onClick={() => setActiveTab('strategy')}>
        <Target size={16} /> Gestão Estratégica
      </div>
      <div className={`tab-item ${activeTab === 'quadrimestre' ? 'active' : ''}`} onClick={() => setActiveTab('quadrimestre')}>
        <TrendingUp size={16} /> Dashboard Quadrimestre
      </div>
    </nav>
  );
};

export default TabNavigation;
