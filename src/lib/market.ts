import type {
  AssetConfig,
  ChartPoint,
  ModelBundle,
  NNResult,
  RegressionResult,
  Signal,
} from './types';
import { fmtDate, clamp } from './format';

/* ------------------------------------------------------------------ */
/* Deterministic RNG                                                   */
/* ------------------------------------------------------------------ */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number): number {
  const u = Math.max(rng(), 1e-10);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

/* ------------------------------------------------------------------ */
/* Price series — geometric Brownian motion, ends exactly at basePrice */
/* ------------------------------------------------------------------ */

interface RawSeries {
  prices: number[];
  volumes: number[];
  dates: Date[];
}

export function generateSeries(asset: AssetConfig, days: number): RawSeries {
  const rng = mulberry32(asset.seed * 7919 + days * 104729);
  const prices: number[] = [];
  const volumes: number[] = [];
  const dates: Date[] = [];

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Start price chosen so the walk ends near basePrice
  let p = asset.basePrice * Math.exp(-asset.drift * days);

  for (let i = 0; i < days; i++) {
    const z = gaussian(rng);
    const shock = asset.drift - 0.5 * asset.volatility ** 2 + asset.volatility * z;
    p = p * Math.exp(shock);
    prices.push(p);
    const baseVol = asset.avgVolume * (0.55 + rng() * 0.9) * (1 + Math.abs(z) * 0.6);
    volumes.push(baseVol);
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    dates.push(d);
  }

  // Rescale so the final close equals basePrice exactly
  const scale = asset.basePrice / prices[prices.length - 1];
  return {
    prices: prices.map((x) => x * scale),
    volumes,
    dates,
  };
}

/* ------------------------------------------------------------------ */
/* Ordinary least squares regression                                   */
/* ------------------------------------------------------------------ */

export function fitRegression(prices: number[]): RegressionResult {
  const n = prices.length;
  const sumX = (n * (n - 1)) / 2;
  const sumXX = ((n - 1) * n * (2 * n - 1)) / 6;
  const sumY = prices.reduce((a, b) => a + b, 0);
  const sumXY = prices.reduce((a, y, i) => a + i * y, 0);
  const denom = n * sumXX - sumX * sumX;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const meanY = sumY / n;

  let ssRes = 0;
  let ssTot = 0;
  let mae = 0;
  let mape = 0;
  const fitted: number[] = [];

  for (let i = 0; i < n; i++) {
    const fit = slope * i + intercept;
    fitted.push(fit);
    const e = prices[i] - fit;
    ssRes += e * e;
    ssTot += (prices[i] - meanY) ** 2;
    mae += Math.abs(e);
    mape += Math.abs(e / prices[i]);
  }

  const r2 = clamp(1 - ssRes / ssTot, 0, 0.999);
  const adjR2 = clamp(1 - ((1 - r2) * (n - 1)) / (n - 2), 0, 0.999);
  const rmse = Math.sqrt(ssRes / n);
  const stdErr = Math.sqrt(ssRes / (n - 2));
  const seSlope = stdErr / Math.sqrt(denom);
  const tStat = slope / (seSlope || 1e-12);
  const pValue = clamp(2 * (1 - normalCdf(Math.abs(tStat))), 1e-16, 1);
  const mse = ssRes / n;
  const msModel = (ssTot - ssRes) / 1;
  const fStat = msModel / mse;

  // Durbin-Watson on residuals
  let dwNum = 0;
  for (let i = 1; i < n; i++) {
    const e1 = prices[i] - (slope * i + intercept);
    const e0 = prices[i - 1] - (slope * (i - 1) + intercept);
    dwNum += (e1 - e0) ** 2;
  }
  const dw = dwNum / ssRes;

  return {
    slope,
    intercept,
    r2,
    adjR2,
    mae: mae / n,
    rmse,
    mape: (mape / n) * 100,
    stdErr,
    tStat,
    pValue,
    dw,
    fStat,
    n,
    fitted,
  };
}

/* ------------------------------------------------------------------ */
/* Simulated LSTM neural network fit                                   */
/* ------------------------------------------------------------------ */

export function fitNN(prices: number[], seed: number): NNResult {
  const rng = mulberry32(seed * 31 + 7);
  const n = prices.length;

  // In-sample fit: smoothed residual error → realistic R² ≈ 0.96–0.99
  let err = 0;
  const fitted: number[] = [];
  for (let i = 0; i < n; i++) {
    err = err * 0.82 + (rng() - 0.5) * 0.0035;
    fitted.push(prices[i] * (1 + err));
  }

  let ssRes = 0;
  let ssTot = 0;
  let mae = 0;
  let mape = 0;
  const meanY = prices.reduce((a, b) => a + b, 0) / n;
  for (let i = 0; i < n; i++) {
    const e = prices[i] - fitted[i];
    ssRes += e * e;
    ssTot += (prices[i] - meanY) ** 2;
    mae += Math.abs(e);
    mape += Math.abs(e / prices[i]);
  }

  const r2 = clamp(1 - ssRes / ssTot, 0.9, 0.999);
  const rmse = Math.sqrt(ssRes / n);
  const maeV = mae / n;
  const mapeV = (mape / n) * 100;

  return {
    architecture: 'LSTM(64) → LSTM(32) → Dense(16) → Linear(1)',
    epochs: 150,
    bestEpoch: 108 + Math.floor(rng() * 30),
    learningRate: 0.001,
    optimizer: 'AdamW',
    batchSize: 32,
    dropout: 0.2,
    trainLoss: rmse * rmse * (0.88 + rng() * 0.08),
    valLoss: rmse * rmse * (1.04 + rng() * 0.12),
    r2,
    mae: maeV,
    rmse,
    mape: mapeV,
    trainTimeSec: 41 + rng() * 28,
    fitted,
  };
}

/* ------------------------------------------------------------------ */
/* Forecast — momentum + mean reversion + widening confidence band     */
/* ------------------------------------------------------------------ */

const HORIZON = 30;

interface ForecastPaths {
  path: number[];
  lower: number[];
  upper: number[];
}

function buildForecastPaths(prices: number[], seed: number): ForecastPaths {
  const rng = mulberry32(seed * 13 + 101);
  const n = prices.length;
  const last = prices[n - 1];
  const window = Math.min(20, n - 1);

  let logRet = 0;
  for (let i = n - window; i < n; i++) logRet += Math.log(prices[i] / prices[i - 1]);
  const dailyDrift = logRet / window;

  let varSum = 0;
  for (let i = n - window; i < n; i++) {
    const r = Math.log(prices[i] / prices[i - 1]);
    varSum += (r - dailyDrift) ** 2;
  }
  const dailyVol = Math.sqrt(varSum / (window - 1));

  const ema20 = prices.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, n);
  const reversion = Math.log(ema20 / last) * 0.02;

  const path: number[] = [last];
  const lower: number[] = [last];
  const upper: number[] = [last];

  let cursor = last;
  for (let k = 1; k <= HORIZON; k++) {
    const decay = Math.pow(0.94, k);
    const shock = (rng() - 0.5) * 0.35 * dailyVol;
    const step = dailyDrift * decay + reversion * decay + shock;
    cursor = cursor * Math.exp(step);
    const width = last * dailyVol * 1.28 * Math.sqrt(k) * (0.9 + rng() * 0.2);
    path.push(cursor);
    lower.push(cursor - width);
    upper.push(cursor + width);
  }

  return { path, lower, upper };
}

/* ------------------------------------------------------------------ */
/* Full model bundle                                                   */
/* ------------------------------------------------------------------ */

export function buildModel(asset: AssetConfig, rangeDays: number): ModelBundle {
  const raw = generateSeries(asset, rangeDays);
  const prices = raw.prices;
  const n = prices.length;
  const last = prices[n - 1];
  const prevClose = prices[n - 2];

  const reg = fitRegression(prices);
  const nn = fitNN(prices, asset.seed);
  const paths = buildForecastPaths(prices, asset.seed + rangeDays);

  const annVol = Math.sqrt(365) * (() => {
    const w = Math.min(20, n - 1);
    let s = 0;
    let m = 0;
    for (let i = n - w; i < n; i++) m += Math.log(prices[i] / prices[i - 1]);
    m /= w;
    for (let i = n - w; i < n; i++) {
      const r = Math.log(prices[i] / prices[i - 1]);
      s += (r - m) ** 2;
    }
    return Math.sqrt(s / (w - 1));
  })() * 100;

  const return30 = (paths.path[HORIZON] / last - 1) * 100;
  const return7 = (paths.path[7] / last - 1) * 100;

  const signal: Signal =
    return30 > 4 ? 'STRONG BUY' :
    return30 > 1 ? 'BUY' :
    return30 < -4 ? 'STRONG SELL' :
    return30 < -1 ? 'SELL' : 'NEUTRAL';

  const signalScore = clamp(return30 * 9, -100, 100);

  const rng = mulberry32(asset.seed * 17 + 3);
  const confidence = clamp(
    Math.round(76 - annVol * 0.32 + Math.abs(return30) * 1.1 + rng() * 8),
    34,
    96,
  );

  const beta =
    asset.category === 'crypto' ? 1.3 + rng() * 0.9 :
    asset.category === 'gold' ? 0.25 + rng() * 0.3 :
    0.8 + rng() * 0.55;

  const sharpe = (return30 / 100 * 12) / (annVol / 100 || 1);

  const recent = prices.slice(-30);
  const support = Math.min(...recent) * 0.985;
  const resistance = Math.max(...recent) * 1.015;

  const dayHigh = Math.max(prices[n - 1], prices[n - 2], prices[n - 3]) * 1.004;
  const dayLow = Math.min(prices[n - 1], prices[n - 2], prices[n - 3]) * 0.996;

  /* ---------------- chart data ---------------- */

  const data: ChartPoint[] = [];
  for (let i = 0; i < n; i++) {
    data.push({
      date: fmtDate(raw.dates[i]),
      timestamp: raw.dates[i].getTime(),
      price: round(prices[i], asset.decimals),
      volume: Math.round(raw.volumes[i]),
      regressionFit: round(reg.fitted[i], asset.decimals),
      nnFit: round(nn.fitted[i], asset.decimals),
      forecast: null,
      ciLower: prices[i],
      ciUpper: prices[i],
      ciWidth: 0,
    });
  }

  // Seed the forecast line at the last historical close
  data[n - 1].forecast = round(last, asset.decimals);

  for (let k = 1; k <= HORIZON; k++) {
    const d = new Date(raw.dates[n - 1]);
    d.setDate(d.getDate() + k);
    const fc = paths.path[k];
    const lo = paths.lower[k];
    const hi = paths.upper[k];
    data.push({
      date: fmtDate(d),
      timestamp: d.getTime(),
      price: null,
      volume: null,
      regressionFit: null,
      nnFit: null,
      forecast: round(fc, asset.decimals),
      ciLower: round(lo, asset.decimals),
      ciUpper: round(hi, asset.decimals),
      ciWidth: round(hi - lo, asset.decimals),
    });
  }

  return {
    data,
    reg,
    nn,
    forecast: {
      target7: round(paths.path[7], asset.decimals),
      target30: round(paths.path[HORIZON], asset.decimals),
      return7,
      return30,
      signal,
      signalScore,
      confidence,
      annVol,
      sharpe,
      beta,
      support: round(support, asset.decimals),
      resistance: round(resistance, asset.decimals),
      ci7: [round(paths.lower[7], asset.decimals), round(paths.upper[7], asset.decimals)],
      ci30: [round(paths.lower[HORIZON], asset.decimals), round(paths.upper[HORIZON], asset.decimals)],
      forecastPath: paths.path,
      ciLowerPath: paths.lower,
      ciUpperPath: paths.upper,
    },
    lastPrice: round(last, asset.decimals),
    prevClose: round(prevClose, asset.decimals),
    dayHigh: round(dayHigh, asset.decimals),
    dayLow: round(dayLow, asset.decimals),
    totalVolume: raw.volumes.reduce((a, b) => a + b, 0),
    n,
  };
}

function round(v: number, d: number): number {
  const f = 10 ** d;
  return Math.round(v * f) / f;
}
