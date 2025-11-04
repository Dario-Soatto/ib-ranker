import { getConfig } from './config';

const config = getConfig();

// Dynamic stage type based on config
export type Stage = typeof config.stages[number]['value'];

export interface Fund {
  id: number;
  name: string;
  website: string;
  stage: string; // Keep as string for flexibility
  logo_url: string | null;
  elo_score: number;
  match_count: number;
  created_at: Date;
}

export interface SanitizedFund {
  name: string;
  website: string;
  stage: string;
  logo_url: string | null;
  elo_score: number;
  match_count: number;
}