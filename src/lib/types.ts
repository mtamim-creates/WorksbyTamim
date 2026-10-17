export type Category = 'gold' | 'crypto' | 'stocks';

export interface AssetConfig {
  id: string;
  symbol: string;
  name: string;
  category: Category;
  basePrice: number;
  drift: number; // daily log-return drift
  volatility: number; // daily volatility
  seed: number;
  decimals: number;
  avgVolume: number;
  marketCap: string;
  dayChange: number; // static reference change %
  color: string; // avatar accent
}

export interface ChartPoint {
  date: string;
  timestamp: number;
  price: number | null;
  volume: number | null;
  regressionFit: number | null;
  nnFit: number | null;
  forecast: number | null;
  ciLower: number | null;
  ciUpper: number | null;
  ciWidth: number; // stacked band helper (ciUpper - ciLower), 0 for history
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  r2: number;
  adjR2: number;
  mae: number;
  rmse: number;
  mape: number;
  stdErr: number;
  tStat: number;
  pValue: number;
  dw: number; // Durbin-Watson
  fStat: number;
  n: number;
  fitted: number[];
}

export interface NNResult {
  architecture: string;
  epochs: number;
  bestEpoch: number;
  learningRate: number;
  optimizer: string;
  batchSize: number;
  dropout: number;
  trainLoss: number; // final MSE
  valLoss: number;
  r2: number;
  mae: number;
  rmse: number;
  mape: number;
  trainTimeSec: number;
  fitted: number[];
}

export type Signal = 'STRONG BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG SELL';

export interface ForecastResult {
  target7: number;
  target30: number;
  return7: number; // %
  return30: number; // %
  signal: Signal;
  signalScore: number; // -100..100 for gauge
  confidence: number; // 0..100
  annVol: number; // annualized volatility %
  sharpe: number;
  beta: number;
  support: number;
  resistance: number;
  ci7: [number, number];
  ci30: [number, number];
  forecastPath: number[];
  ciLowerPath: number[];
  ciUpperPath: number[];
}

export interface ModelBundle {
  data: ChartPoint[];
  reg: RegressionResult;
  nn: NNResult;
  forecast: ForecastResult;
  lastPrice: number;
  prevClose: number;
  dayHigh: number;
  dayLow: number;
  totalVolume: number;
  n: number;
}
