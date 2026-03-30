export interface DashboardMetadata {
  title: string;
  date: string;
  location: string;
  indicators: string;
}

export interface DashboardData {
  metadata: DashboardMetadata;
  data: CSVRecord[];
}

export interface CSVRecord {
  'Competência/Ano'?: string;
  'UF'?: string;
  'IBGE Município'?: string;
  'Nome Município'?: string;
  'Condição de Equipe'?: string;
  'CNES'?: string;
  'ESTABELECIMENTO'?: string;
  'TIPO DO ESTABELECIMENTO'?: string;
  'INE'?: string;
  'NOME DA EQUIPE'?: string;
  'SIGLA DA EQUIPE'?: string;
  [key: string]: string | number | undefined;
}

export interface FilterState {
  municipio: string;
  sigla: string;
  estabelecimento: string;
  equipe: string;
}

export interface FilterOptions {
  municipios: string[];
  siglas: string[];
  estabelecimentos: string[];
  equipes: string[];
}
