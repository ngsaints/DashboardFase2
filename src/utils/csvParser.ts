import Papa from 'papaparse';

/**
 * Parses dashboard CSV files with dynamic header detection and data cleaning.
 */
export const parseDashboardCSV = async (url: string) => {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar CSV (${response.status}): ${response.statusText}`);
  }
  
  const text = await response.text();
  
  if (!text || text.trim().length === 0) {
    throw new Error('Arquivo CSV está vazio.');
  }
  
  const lines = text.split('\n');
  
  // Find the header line (usually starts with "Competência/Ano")
  const headerIndex = lines.findIndex(line => line.includes('Competência/Ano'));
  
  if (headerIndex === -1) {
    throw new Error('Formato do CSV inválido: cabeçalho não encontrado.');
  }
  
  const metadataLines = lines.slice(0, headerIndex);
  const dataBlock = lines.slice(headerIndex).join('\n');
  
  const parsed = Papa.parse(dataBlock, {
    header: true,
    skipEmptyLines: true,
    delimiter: ";",
    transformHeader: (h: string) => h.trim().replace(/"/g, ''),
    transform: (v: string) => {
      const val = v.trim().replace(/"/g, '').replace(/\t/g, '');
      // If it looks like a number with a comma, convert to a valid number
      if (/^-?\d+,\d+$/.test(val)) {
        return parseFloat(val.replace(',', '.'));
      }
      // If it's a number, return it as a number
      if (!isNaN(val as any) && val !== '') {
        return parseFloat(val);
      }
      return val;
    }
  });

  const getMetadataValue = (lines: string[], searchStr: string) => {
    const line = lines.find(l => l.includes(searchStr));
    if (!line) return 'Não informado';
    return line.split(':')[1]?.trim() || line.trim();
  };

  const getTitle = (lines: string[]) => {
    // Try line 5 (index 4) which usually has the title
    const line = lines[4];
    if (!line) return 'Dashboard';
    if (line.includes('|')) return line.split('|')[1].trim();
    if (line.includes('-')) return line.split('-').slice(1).join('-').trim();
    return line.trim();
  };

  return {
    metadata: {
      title: getTitle(metadataLines),
      date: getMetadataValue(metadataLines, 'Dado gerado em'),
      location: getMetadataValue(metadataLines, 'Município'),
      indicators: getMetadataValue(metadataLines, 'Indicador selecionado')
    },
    data: parsed.data as any[]
  };
};
