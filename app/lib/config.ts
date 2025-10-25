export type RankerType = 'vc' | 'ib';

export interface RankerConfig {
  title: string;
  entityName: string; // "fund" or "investment bank"
  entityNamePlural: string; // "funds" or "investment banks"
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
};

// Get config based on environment variable
export function getConfig(): RankerConfig {
  const type = (process.env.NEXT_PUBLIC_RANKER_TYPE || 'vc') as RankerType;
  return CONFIGS[type];
}