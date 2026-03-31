import React from 'react';
import Plotly from 'plotly.js-dist-min';
import _createPlotlyComponent from 'react-plotly.js/factory';
import { Users, CheckCircle, Target, AlertTriangle, TrendingUp } from 'lucide-react';
import type { CSVRecord } from '../types/dashboard';

// Handle potential ESM/CJS interop issues with createPlotlyComponent
const createPlotlyComponent = _createPlotlyComponent 
  ? (typeof _createPlotlyComponent === 'function' ? _createPlotlyComponent : (_createPlotlyComponent as any).default)
  : null;

const Plot = createPlotlyComponent ? createPlotlyComponent(Plotly) : null;

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, subtitle, color }) => (
  <div className="metric-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div className="metric-label">{label}</div>
      <div style={{ color: color || '#1f4e79', backgroundColor: '#f0f4f8', padding: '4px', borderRadius: '50%' }}>
        {icon}
      </div>
    </div>
    <div className="metric-value">{value}</div>
    {subtitle && (
      <div className="metric-indicator">
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color || '#22c55e' }}></span>
        {subtitle}
      </div>
    )}
  </div>
);

interface AnalyticsProps {
  data: CSVRecord[];
  activeTab: string;
}

const Analytics: React.FC<AnalyticsProps> = ({ data, activeTab }) => {
  // Helper to ensure numeric value (data is already mostly cleaned by the parser)
  const ensureNumber = (val: any): number => {
    if (typeof val === 'number') return val;
    if (val === 'N/A' || val === '' || val === null || val === undefined) return 0;
    return parseFloat(String(val)) || 0;
  };

  // Detect which dataset we're looking at
  const isQualidade = data.length > 0 && Object.keys(data[0]).some(k => k.startsWith('C1 -'));
  const isCVAT = data.length > 0 && Object.keys(data[0]).some(k => k.includes('CVAT'));

  // Extracting key values from data for charts
  let chartColumns: (keyof CSVRecord)[] = [];
  if (isQualidade) {
    // Better regex to match indicators like "C1 - ...", "B2 - ...", "M1 - ...", "CR1 - ...", "P1 - ..."
    // Excludes technical columns like "CNES", "INE", "UF", etc.
    const indicatorRegex = /^[CBMP](R?\d+)\s-/;
    chartColumns = Object.keys(data[0]).filter(k => 
      indicatorRegex.test(k) && !k.includes('Classificação')
    ) as (keyof CSVRecord)[];
  } else if (isCVAT) {
    chartColumns = [
      'Resultado da Dimensão Cadastro',
      'Resultado Acompanhamento',
      'Resultado do Componente Vínculo e Acompanhamento Territorial (CVAT)'
    ] as (keyof CSVRecord)[];
  } else if (data.length > 0) {
    chartColumns = Object.keys(data[0]).filter(k => 
      !k.includes('Classificação') && 
      !['Competência/Ano', 'UF', 'IBGE Município', 'Nome Município', 'Condição de Equipe', 'CNES', 'ESTABELECIMENTO', 'TIPO DO ESTABELECIMENTO', 'INE', 'NOME DA EQUIPE', 'SIGLA DA EQUIPE', 'PARÂMETRO POPULACIONAL'].includes(k)
    ) as (keyof CSVRecord)[];
  }
  
  // Performance Color Mapping
  const getColor = (classification: string) => {
    switch (classification?.toUpperCase()) {
      case 'ÓTIMO': return '#22c55e';
      case 'BOM': return '#3b82f6';
      case 'SUFICIENTE': return '#f59e0b';
      case 'REGULAR': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  // Prepare data for the chart by filtering out indicators with no values
  const chartData = chartColumns.map((c, idx) => {
    const validRows = data.filter(row => row[c] !== 'N/A' && row[c] !== '-' && row[c] !== '');
    if (validRows.length === 0) return null;
    
    const sum = validRows.reduce((acc, row) => acc + ensureNumber(row[c]), 0);
    const avg = sum / (validRows.length || 1);
    
    // Get status for color/label
    const classificationCol = `${String(c)} - Classificação`;
    let status = 'REGULAR';
    
    if (data.length <= 5) {
      const firstValidRow = data.find(row => row[classificationCol] && row[classificationCol] !== 'N/A' && row[classificationCol] !== '-');
      if (firstValidRow) {
        status = String(firstValidRow[classificationCol as keyof CSVRecord]).toUpperCase().trim();
      } else {
        const percent = isCVAT ? avg * 10 : avg;
        if (percent >= 80) status = 'ÓTIMO';
        else if (percent >= 60) status = 'BOM';
        else if (percent >= 40) status = 'SUFICIENTE';
      }
    } else {
      const percent = isCVAT ? avg * 10 : avg;
      if (percent >= 80) status = 'ÓTIMO';
      else if (percent >= 60) status = 'BOM';
      else if (percent >= 40) status = 'SUFICIENTE';
    }

    const colName = String(c);
    let label = colName;
    if (isQualidade && colName.includes('-')) {
      label = colName.split('-')[1]?.trim() || colName;
    }
    const truncatedLabel = label.length > 35 ? label.substring(0, 32) + '...' : label;

    return {
      column: c,
      value: avg,
      status: status,
      label: truncatedLabel,
      fullLabel: colName
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  const chartCategories = chartData.map(d => d.label);
  const chartValues = chartData.map(d => d.value);
  const chartStatuses = chartData.map(d => d.status);
  
  const barColors = chartStatuses.map(s => {
    switch (s) {
      case 'ÓTIMO': return '#22c55e';
      case 'BOM': return '#3b82f6';
      case 'SUFICIENTE': return '#f59e0b';
      case 'REGULAR': return '#ef4444';
      default: return '#94a3b8';
    }
  });

  // Keep original values and statuses for the detail table
  const tableValues = chartColumns.map(c => {
    const validRows = data.filter(row => row[c] !== 'N/A' && row[c] !== '-' && row[c] !== '');
    if (validRows.length === 0) return NaN;
    const sum = validRows.reduce((acc, row) => acc + ensureNumber(row[c]), 0);
    return sum / (validRows.length || 1);
  });

  const tableStatuses = chartColumns.map((c, idx) => {
    const classificationCol = `${String(c)} - Classificação`;
    const validRows = data.filter(row => row[c] !== 'N/A' && row[c] !== '-' && row[c] !== '');
    if (validRows.length === 0) return 'N/A';
    
    if (data.length <= 5) {
      const firstValidRow = data.find(row => row[classificationCol] && row[classificationCol] !== 'N/A' && row[classificationCol] !== '-');
      if (firstValidRow) return String(firstValidRow[classificationCol as keyof CSVRecord]).toUpperCase().trim();
    }
    
    const avg = tableValues[idx];
    if (isNaN(avg)) return 'N/A';
    const percent = isCVAT ? avg * 10 : avg;
    if (percent >= 80) return 'ÓTIMO';
    if (percent >= 60) return 'BOM';
    if (percent >= 40) return 'SUFICIENTE';
    return 'REGULAR';
  });

  // Count classifications for donut
  const classificationCounts: Record<string, number> = {};
  data.forEach(row => {
    Object.keys(row).forEach(k => {
      if (k.toLowerCase().includes('classificação')) {
        const val = String(row[k as keyof CSVRecord] || '').toUpperCase().trim();
        if (val && val !== 'N/A' && val !== '-') {
          classificationCounts[val] = (classificationCounts[val] || 0) + 1;
        }
      }
    });
  });

  const donutLabels = Object.keys(classificationCounts);
  const donutValues = Object.values(classificationCounts);
  const donutColors = donutLabels.map(getColor);

  // Dynamic Metrics
  const totalEquipes = data.filter(r => r['NOME DA EQUIPE']).length;
  
  // Calculate average score
  let avgScore = 0;
  if (isCVAT) {
    const cvatCol = 'Resultado do Componente Vínculo e Acompanhamento Territorial (CVAT)';
    const validRows = data.filter(r => r[cvatCol as keyof CSVRecord] && r[cvatCol as keyof CSVRecord] !== 'N/A');
    avgScore = validRows.reduce((acc, r) => acc + ensureNumber(r[cvatCol as keyof CSVRecord]), 0) / (validRows.length || 1);
  } else {
    // For Qualidade, average of all indicator averages
    const validTableValues = tableValues.filter(v => !isNaN(v));
    avgScore = validTableValues.length > 0 ? validTableValues.reduce((a, b) => a + b, 0) / validTableValues.length : 0;
  }

  const totalAlertas = data.reduce((acc, row) => {
    let rowAlerts = 0;
    Object.keys(row).forEach(k => {
      if (k.toLowerCase().includes('classificação')) {
        if (String(row[k as keyof CSVRecord] || '').toUpperCase().trim() === 'REGULAR') rowAlerts++;
      }
    });
    return acc + rowAlerts;
  }, 0);

  // Calculate percentage of ÓTIMO/BOM for the center text of donut
  const totalClassifications = donutValues.reduce((a, b) => a + b, 0);
  const positiveClassifications = (classificationCounts['ÓTIMO'] || 0) + (classificationCounts['BOM'] || 0);
  const positivePercent = totalClassifications > 0 ? ((positiveClassifications / totalClassifications) * 100).toFixed(1) : '0.0';

  if (activeTab === 'indicator') {
    return (
      <div style={{ padding: '0 40px 40px 40px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h2 className="section-title" style={{ marginBottom: '24px' }}>
            <Target size={18} /> Análise Detalhada por Indicador
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--gray-200)', textAlign: 'left' }}>
                  <th style={{ padding: '12px', color: 'var(--gray-600)' }}>Indicador</th>
                  <th style={{ padding: '12px', color: 'var(--gray-600)', textAlign: 'center' }}>Média Score</th>
                  <th style={{ padding: '12px', color: 'var(--gray-600)', textAlign: 'center' }}>Status Geral</th>
                </tr>
              </thead>
              <tbody>
                {chartColumns.map((col, idx) => {
                  const avg = tableValues[idx];
                  const status = tableStatuses[idx];

                  return (
                    <tr key={String(col)} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '12px', fontWeight: 500 }}>{String(col)}</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700 }}>
                        {isNaN(avg) ? '-' : avg.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '4px 12px', 
                          borderRadius: '12px', 
                          fontSize: '11px', 
                          fontWeight: 700,
                          backgroundColor: getColor(status) + '20',
                          color: getColor(status)
                        }}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'facility') {
    const facilityData = data.reduce((acc: Record<string, any>, row) => {
      const name = String(row['ESTABELECIMENTO'] || 'Não identificado');
      if (!acc[name]) acc[name] = { name, count: 0, scoreSum: 0 };
      acc[name].count++;
      
      // Calculate a simple average of indicators for this facility
      let rowScoreSum = 0;
      let rowColCount = 0;
      chartColumns.forEach(col => {
        const val = row[col];
        if (val !== undefined && val !== 'N/A') {
          rowScoreSum += ensureNumber(val);
          rowColCount++;
        }
      });
      if (rowColCount > 0) {
        acc[name].scoreSum += (rowScoreSum / rowColCount);
      }
      return acc;
    }, {});

    const facilities = Object.values(facilityData).sort((a: any, b: any) => (b.scoreSum / b.count) - (a.scoreSum / a.count));

    return (
      <div style={{ padding: '0 40px 40px 40px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h2 className="section-title" style={{ marginBottom: '24px' }}>
            <Users size={18} /> Desempenho por Estabelecimento
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--gray-200)', textAlign: 'left' }}>
                  <th style={{ padding: '12px', color: 'var(--gray-600)' }}>Estabelecimento</th>
                  <th style={{ padding: '12px', color: 'var(--gray-600)', textAlign: 'center' }}>Equipes</th>
                  <th style={{ padding: '12px', color: 'var(--gray-600)', textAlign: 'center' }}>Score Médio</th>
                </tr>
              </thead>
              <tbody>
                {facilities.map((f: any) => (
                  <tr key={f.name} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '12px', fontWeight: 500 }}>{f.name}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{f.count}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700 }}>
                      {(f.scoreSum / f.count).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'quadrimestre') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '40px' }}>
          <TrendingUp size={48} style={{ color: 'var(--gray-300)', marginBottom: '16px' }} />
          <h3>Dashboard Quadrimestre</h3>
          <p style={{ color: 'var(--gray-500)', marginTop: '8px' }}>
            Os dados para visualização quadrimestral não estão disponíveis no arquivo atual ({String(data[0]?.['Competência/Ano'] || 'N/A')}).
          </p>
        </div>
      </div>
    );
  }

  if (activeTab === 'strategy') {
    return (
      <div style={{ padding: '0 40px 40px 40px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h2 className="section-title" style={{ marginBottom: '24px' }}>
            <CheckCircle size={18} /> Gestão Estratégica
          </h2>
          <div className="metrics-grid" style={{ marginBottom: '32px' }}>
            <MetricCard label="COBERTURA" value={`${positivePercent}%`} icon={<Target size={16}/>} subtitle="Ótimo/Bom" color="#22c55e" />
            <MetricCard label="MÉDIA GERAL" value={avgScore.toFixed(2)} icon={<CheckCircle size={16} />} subtitle="Score" color="#3b82f6" />
            <MetricCard label="ALERTAS" value={totalAlertas} icon={<AlertTriangle size={16} />} subtitle="Críticos" color="#ef4444" />
          </div>
          <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>
            Esta visão apresenta um resumo consolidado dos indicadores estratégicos do município para a competência {String(data[0]?.['Competência/Ano'] || 'selecionada')}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div className="card">
          <div className="section-header">
            <h2 className="section-title">
              <TrendingUp size={18} /> Desempenho por Indicador
            </h2>
          </div>
          <div className="chart-container" style={{ height: '600px' }}>
            {Plot ? (
              <Plot
                data={[
                  {
                    x: chartValues,
                    y: chartCategories,
                    type: 'bar',
                    orientation: 'h',
                    text: chartValues.map(v => isNaN(v) ? '' : (isCVAT ? v.toFixed(2) : v.toFixed(1) + '%')),
                    textposition: 'auto',
                    insidetextanchor: 'end',
                    textfont: {
                      size: 11,
                      color: 'white'
                    },
                    marker: {
                      color: barColors,
                      line: { width: 0 }
                    },
                    width: 0.8
                  }
                ]}
                layout={{
                  autosize: true,
                  margin: { t: 10, b: 40, l: 250, r: 30 },
                  xaxis: { 
                    range: [0, isCVAT ? 10 : 100], 
                    gridcolor: '#f0f0f0',
                    showgrid: true,
                    zeroline: false,
                    tickfont: { size: 11 }
                  },
                  yaxis: { 
                    showgrid: false,
                    automargin: true,
                    font: { size: 11 },
                    autorange: 'reversed'
                  },
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { family: 'Inter, sans-serif' }
                }}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div style={{ padding: '20px', color: 'var(--gray-500)', textAlign: 'center' }}>Gráfico indisponível</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div className="metrics-grid">
          <MetricCard label="EQUIPES" value={totalEquipes} icon={<Users size={16}/>} subtitle="INEs" />
          <MetricCard label="MÉDIA NOTA" value={avgScore.toFixed(2)} icon={<CheckCircle size={16} />} subtitle="Consolidada" color="#22c55e" />
          <MetricCard label="INDICADORES" value={chartColumns.length} icon={<Target size={16} />} subtitle="Total" color="#3b82f6" />
          <MetricCard label="ALERTAS" value={totalAlertas} icon={<AlertTriangle size={16} />} subtitle="Críticos" color="#ef4444" />
        </div>

        <div className="card">
          <div className="section-header">
            <h2 className="section-title">Distribuição</h2>
          </div>
          <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '24px', textTransform: 'uppercase', fontWeight: 700 }}>Classificação das Equipes</p>
          <div className="donut-container">
            {Plot ? (
              <Plot
                data={[
                  {
                    values: donutValues,
                    labels: donutLabels,
                    type: 'pie',
                    hole: 0.7,
                    marker: { colors: donutColors },
                    showlegend: false,
                    textinfo: 'none'
                  }
                ]}
                layout={{
                  autosize: true,
                  margin: { t: 0, b: 0, l: 0, r: 0 },
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  annotations: [
                    {
                      font: { size: 20, weight: '800' },
                      showarrow: false,
                      text: `${positivePercent}%`,
                      x: 0.5,
                      y: 0.5
                    }
                  ]
                }}
                style={{ width: '220px', height: '220px' }}
                config={{ displayModeBar: false }}
              />
            ) : (
              <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)' }}>
                Donut indisponível
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
