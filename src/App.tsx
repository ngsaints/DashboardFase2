import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import Analytics from './components/Analytics';
import { parseDashboardCSV } from './utils/csvParser';
import type { DashboardData, FilterState, FilterOptions, CSVRecord } from './types/dashboard';
import './index.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('executive');
  const [currentCSV, setCurrentCSV] = useState('Dado_Agregado_Visão_Geral_-_Componente_Qualidade.csv');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    municipio: 'Todos',
    sigla: 'Todos',
    estabelecimento: 'Todos',
    equipe: 'Todos'
  });

  const csvFiles = useMemo(() => [
    'Dado_Agregado_Visão_Geral_-_Componente_Qualidade.csv',
    'Dado_Agregado_Visão_Geral_-_Componente_Vínculo_e_Acompanhamento_Territorial.csv'
  ], []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await parseDashboardCSV(currentCSV);
        setDashboardData(data as DashboardData);
      } catch (err: any) {
        console.error("Error loading CSV:", err);
        setError(`Falha ao carregar indicadores: ${err.message || 'Erro desconhecido'}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentCSV]);

  // Extract unique filter options from data using useMemo
  // These are now dependent on previous filters
  const filterOptions = useMemo<FilterOptions>(() => {
    const getUniqueOptions = (key: keyof CSVRecord, currentFilteredData: CSVRecord[]) => {
      const options = new Set<string>();
      currentFilteredData.forEach((row: CSVRecord) => {
        const val = row[key];
        if (val !== undefined && String(val).trim() !== '' && String(val).trim() !== 'N/A' && String(val).trim() !== '-') {
          options.add(String(val).trim());
        }
      });
      return Array.from(options).sort();
    };

    const data = dashboardData?.data || [];
    
    // For municipios, always show all available in the dataset
    const municipios = getUniqueOptions('Nome Município', data);
    
    // For siglas, filter by selected municipio
    const dataByMunicipio = data.filter(row => 
      filters.municipio === 'Todos' || String(row['Nome Município'] || '').trim() === filters.municipio
    );
    const siglas = getUniqueOptions('SIGLA DA EQUIPE', dataByMunicipio);
    
    // For estabelecimentos, filter by municipio and sigla
    const dataBySigla = dataByMunicipio.filter(row => 
      filters.sigla === 'Todos' || String(row['SIGLA DA EQUIPE'] || '').trim() === filters.sigla
    );
    const estabelecimentos = getUniqueOptions('ESTABELECIMENTO', dataBySigla);
    
    // For equipes, filter by municipio, sigla and estabelecimento
    const dataByEstabelecimento = dataBySigla.filter(row => 
      filters.estabelecimento === 'Todos' || String(row['ESTABELECIMENTO'] || '').trim() === filters.estabelecimento
    );
    const equipes = getUniqueOptions('NOME DA EQUIPE', dataByEstabelecimento);

    return {
      municipios,
      siglas,
      estabelecimentos,
      equipes
    };
  }, [dashboardData, filters.municipio, filters.sigla, filters.estabelecimento]);

  const handleClearFilters = () => {
    setFilters({
      municipio: 'Todos',
      sigla: 'Todos',
      estabelecimento: 'Todos',
      equipe: 'Todos'
    });
    setSearchTerm('');
  };

  // Filter data based on selected filters and search term using useMemo
  const filteredData = useMemo<CSVRecord[]>(() => {
    return (dashboardData?.data || []).filter((row: CSVRecord) => {
      const m = filters.municipio === 'Todos' || String(row['Nome Município'] || '').trim() === filters.municipio;
      const s = filters.sigla === 'Todos' || String(row['SIGLA DA EQUIPE'] || '').trim() === filters.sigla;
      const e = filters.estabelecimento === 'Todos' || String(row['ESTABELECIMENTO'] || '').trim() === filters.estabelecimento;
      const eq = filters.equipe === 'Todos' || String(row['NOME DA EQUIPE'] || '').trim() === filters.equipe;
      
      const searchMatch = !searchTerm || 
        Object.values(row).some(val => 
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        );

      return m && s && e && eq && searchMatch;
    });
  }, [dashboardData, filters, searchTerm]);

  return (
    <div className="dashboard-container">
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 90
          }}
        />
      )}
      <Sidebar 
        onSearch={setSearchTerm} 
        searchTerm={searchTerm}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        filters={filters}
        setFilters={setFilters}
        options={filterOptions}
        onClearFilters={handleClearFilters}
      />

      <main className="main-content">
        <Header 
          title="Monitoramento" 
          subtitle={`${dashboardData?.metadata?.title || 'GESTÃO ESTRATÉGICA'} | ${dashboardData?.metadata?.date || '30/03/2026'}`} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        
        {/* Dataset Switcher Component as a set of tabs above the main navigation */}
        <div className="dataset-switcher" style={{ padding: '0 40px', display: 'flex', gap: '10px', marginTop: '10px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {csvFiles.map(file => (
            <button
              key={file}
              onClick={() => {
                setCurrentCSV(file);
                setFilters({ municipio: 'Todos', sigla: 'Todos', estabelecimento: 'Todos', equipe: 'Todos' });
              }}
              className="dataset-btn"
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                border: '1px solid var(--gray-200)',
                backgroundColor: currentCSV === file ? 'var(--wr-blue)' : 'white',
                color: currentCSV === file ? 'white' : 'var(--gray-600)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {file.replace('.csv', '').replace('Dado_Agregado_Visão_Geral_-_Componente_', '')}
            </button>
          ))}
        </div>

        <TabNavigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        {error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--performance-regular)', fontWeight: 'bold' }}>
            {error}
          </div>
        ) : loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>
            Carregando indicadores...
          </div>
        ) : (
          <Analytics 
            data={filteredData} 
            activeTab={activeTab}
          />
        )}
      </main>
    </div>
  );
};

export default App;
