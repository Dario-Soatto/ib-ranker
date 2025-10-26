export type RankerType = 'vc' | 'ib' | 'hf'; // Add 'hf'

export interface RankerConfig {
  title: string;
  entityName: string;
  entityNamePlural: string;
  stages: {
    value: string;
    label: string;
  }[];
}

const CONFIGS: Record<RankerType, RankerConfig> = {
  vc: {
    title: 'VC Fund Ranker',
    entityName: 'fund',
    entityNamePlural: 'funds',
    stages: [
      { value: 'early', label: 'Early Stage' },
      { value: 'multi', label: 'Multi Stage' },
      { value: 'late', label: 'Late Stage' },
    ],
  },
  ib: {
    title: 'IB Firm Ranker',
    entityName: 'investment bank',
    entityNamePlural: 'investment banks',
    stages: [
      { value: 'bulge bracket', label: 'Bulge Bracket' },
      { value: 'elite boutique', label: 'Elite Boutique' },
      { value: 'middle market', label: 'Middle Market' },
    ],
  },
  hf: {
    title: 'Hedge Fund Ranker',
    entityName: 'hedge fund',
    entityNamePlural: 'hedge funds',
    stages: [
      { value: 'multi-strategy', label: 'Multi-Strategy' },
      { value: 'long-short equity', label: 'Long/Short Equity' },
      { value: 'quantitative', label: 'Quantitative' },
    ],
  },
};

export function getConfig(): RankerConfig {
  const type = (process.env.NEXT_PUBLIC_RANKER_TYPE || 'vc') as RankerType;
  return CONFIGS[type];
}