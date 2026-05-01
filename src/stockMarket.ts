/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Stock, StockHolding, GameState } from './types.ts';

export const INITIAL_STOCKS: Stock[] = [
  // ── United States ──────────────────────────────────────────────
  { ticker: 'NVDA', name: 'NVIDIA Corporation',   countryId: 'usa',          sector: 'Tech',     marketCap: 3.30, baseMarketCap: 3.30, priceHistory: [], changePct: 0 },
  { ticker: 'AAPL', name: 'Apple Inc.',            countryId: 'usa',          sector: 'Tech',     marketCap: 3.50, baseMarketCap: 3.50, priceHistory: [], changePct: 0 },
  { ticker: 'MSFT', name: 'Microsoft Corp.',       countryId: 'usa',          sector: 'Tech',     marketCap: 3.20, baseMarketCap: 3.20, priceHistory: [], changePct: 0 },
  { ticker: 'GOOGL', name: 'Alphabet Inc.',        countryId: 'usa',          sector: 'Tech',     marketCap: 2.10, baseMarketCap: 2.10, priceHistory: [], changePct: 0 },
  { ticker: 'AMZN', name: 'Amazon.com Inc.',       countryId: 'usa',          sector: 'Tech',     marketCap: 1.90, baseMarketCap: 1.90, priceHistory: [], changePct: 0 },
  { ticker: 'JPM',  name: 'JPMorgan Chase',        countryId: 'usa',          sector: 'Finance',  marketCap: 0.60, baseMarketCap: 0.60, priceHistory: [], changePct: 0 },
  { ticker: 'XOM',  name: 'ExxonMobil Corp.',      countryId: 'usa',          sector: 'Energy',   marketCap: 0.50, baseMarketCap: 0.50, priceHistory: [], changePct: 0 },
  { ticker: 'LMT',  name: 'Lockheed Martin',       countryId: 'usa',          sector: 'Defense',  marketCap: 0.13, baseMarketCap: 0.13, priceHistory: [], changePct: 0 },
  { ticker: 'RTX',  name: 'RTX Corporation',       countryId: 'usa',          sector: 'Defense',  marketCap: 0.15, baseMarketCap: 0.15, priceHistory: [], changePct: 0 },
  // ── China ──────────────────────────────────────────────────────
  { ticker: 'BABA', name: 'Alibaba Group',         countryId: 'china',        sector: 'Tech',     marketCap: 0.22, baseMarketCap: 0.22, priceHistory: [], changePct: 0 },
  { ticker: 'TCEHY',name: 'Tencent Holdings',      countryId: 'china',        sector: 'Tech',     marketCap: 0.45, baseMarketCap: 0.45, priceHistory: [], changePct: 0 },
  { ticker: 'BYDDY',name: 'BYD Company',           countryId: 'china',        sector: 'Auto',     marketCap: 0.10, baseMarketCap: 0.10, priceHistory: [], changePct: 0 },
  { ticker: 'PTR',  name: 'PetroChina',            countryId: 'china',        sector: 'Energy',   marketCap: 0.18, baseMarketCap: 0.18, priceHistory: [], changePct: 0 },
  // ── European Union ─────────────────────────────────────────────
  { ticker: 'ASML', name: 'ASML Holding',          countryId: 'eu',           sector: 'Tech',     marketCap: 0.35, baseMarketCap: 0.35, priceHistory: [], changePct: 0 },
  { ticker: 'AIR',  name: 'Airbus SE',             countryId: 'eu',           sector: 'Defense',  marketCap: 0.13, baseMarketCap: 0.13, priceHistory: [], changePct: 0 },
  { ticker: 'MC',   name: 'LVMH Moët Hennessy',   countryId: 'eu',           sector: 'Consumer', marketCap: 0.38, baseMarketCap: 0.38, priceHistory: [], changePct: 0 },
  { ticker: 'SAP',  name: 'SAP SE',                countryId: 'eu',           sector: 'Tech',     marketCap: 0.22, baseMarketCap: 0.22, priceHistory: [], changePct: 0 },
  // ── United Kingdom ─────────────────────────────────────────────
  { ticker: 'SHEL', name: 'Shell PLC',             countryId: 'uk',           sector: 'Energy',   marketCap: 0.24, baseMarketCap: 0.24, priceHistory: [], changePct: 0 },
  { ticker: 'AZN',  name: 'AstraZeneca',           countryId: 'uk',           sector: 'Pharma',   marketCap: 0.28, baseMarketCap: 0.28, priceHistory: [], changePct: 0 },
  { ticker: 'BA.',  name: 'BAE Systems',           countryId: 'uk',           sector: 'Defense',  marketCap: 0.08, baseMarketCap: 0.08, priceHistory: [], changePct: 0 },
  // ── Japan ──────────────────────────────────────────────────────
  { ticker: 'TM',   name: 'Toyota Motor',          countryId: 'japan',        sector: 'Auto',     marketCap: 0.28, baseMarketCap: 0.28, priceHistory: [], changePct: 0 },
  { ticker: 'SONY', name: 'Sony Group Corp.',      countryId: 'japan',        sector: 'Tech',     marketCap: 0.12, baseMarketCap: 0.12, priceHistory: [], changePct: 0 },
  { ticker: '9984', name: 'SoftBank Group',        countryId: 'japan',        sector: 'Finance',  marketCap: 0.07, baseMarketCap: 0.07, priceHistory: [], changePct: 0 },
  // ── South Korea ────────────────────────────────────────────────
  { ticker: '005930',name: 'Samsung Electronics',  countryId: 'south-korea',  sector: 'Tech',     marketCap: 0.35, baseMarketCap: 0.35, priceHistory: [], changePct: 0 },
  { ticker: '005380',name: 'Hyundai Motor',        countryId: 'south-korea',  sector: 'Auto',     marketCap: 0.04, baseMarketCap: 0.04, priceHistory: [], changePct: 0 },
  // ── Taiwan ─────────────────────────────────────────────────────
  { ticker: 'TSM',  name: 'TSMC',                  countryId: 'taiwan',       sector: 'Tech',     marketCap: 0.82, baseMarketCap: 0.82, priceHistory: [], changePct: 0 },
  // ── Saudi Arabia ───────────────────────────────────────────────
  { ticker: '2222', name: 'Saudi Aramco',          countryId: 'saudi-arabia', sector: 'Energy',   marketCap: 1.80, baseMarketCap: 1.80, priceHistory: [], changePct: 0 },
  // ── India ──────────────────────────────────────────────────────
  { ticker: 'INFY', name: 'Infosys Ltd.',          countryId: 'india',        sector: 'Tech',     marketCap: 0.08, baseMarketCap: 0.08, priceHistory: [], changePct: 0 },
  { ticker: 'RELI', name: 'Reliance Industries',   countryId: 'india',        sector: 'Energy',   marketCap: 0.22, baseMarketCap: 0.22, priceHistory: [], changePct: 0 },
  // ── Russia (sanctioned) ────────────────────────────────────────
  { ticker: 'GAZP', name: 'Gazprom PJSC',          countryId: 'russia',       sector: 'Energy',   marketCap: 0.05, baseMarketCap: 0.05, priceHistory: [], changePct: 0 },
  { ticker: 'SBER', name: 'Sberbank PJSC',         countryId: 'russia',       sector: 'Finance',  marketCap: 0.04, baseMarketCap: 0.04, priceHistory: [], changePct: 0 },
  // ── Brazil ─────────────────────────────────────────────────────
  { ticker: 'PBR',  name: 'Petrobras',             countryId: 'brazil',       sector: 'Energy',   marketCap: 0.09, baseMarketCap: 0.09, priceHistory: [], changePct: 0 },
  { ticker: 'VALE', name: 'Vale S.A.',             countryId: 'brazil',       sector: 'Materials', marketCap: 0.06, baseMarketCap: 0.06, priceHistory: [], changePct: 0 },
  // ── Australia ──────────────────────────────────────────────────
  { ticker: 'BHP',  name: 'BHP Group',             countryId: 'australia',    sector: 'Materials', marketCap: 0.20, baseMarketCap: 0.20, priceHistory: [], changePct: 0 },
  // ── Israel ─────────────────────────────────────────────────────
  { ticker: 'CHKP', name: 'Check Point Software',  countryId: 'israel',       sector: 'Tech',     marketCap: 0.02, baseMarketCap: 0.02, priceHistory: [], changePct: 0 },
  // ── Nigeria ────────────────────────────────────────────────────
  { ticker: 'NNPC', name: 'NNPC Limited',          countryId: 'nigeria',      sector: 'Energy',   marketCap: 0.03, baseMarketCap: 0.03, priceHistory: [], changePct: 0 },
  // ── Indonesia ──────────────────────────────────────────────────
  { ticker: 'GOTO', name: 'GoTo Gojek Tokopedia',  countryId: 'indonesia',    sector: 'Tech',     marketCap: 0.01, baseMarketCap: 0.01, priceHistory: [], changePct: 0 },
];

const SECTOR_BASE_VOL: Record<string, number> = {
  Tech: 0.15, Energy: 0.12, Defense: 0.08, Finance: 0.10,
  Auto: 0.11, Materials: 0.13, Pharma: 0.09, Consumer: 0.09,
};

export interface MarketTickResult {
  updatedStocks: Stock[];
  marketHeadlines: string[];
  portfolioGdpDelta: number; // realized change to player GDP from open positions
}

export function tickStockMarket(
  stocks: Stock[],
  portfolio: StockHolding[],
  state: GameState,
  prevStances: Record<string, string>,
): MarketTickResult {
  const headlines: string[] = [];

  // ── Detect geopolitical stance changes ──
  const stanceChanges: Record<string, { from: string; to: string; name: string }> = {};
  for (const c of state.countries) {
    const prev = prevStances[c.id];
    if (prev && prev !== c.stanceTowardsPlayer) {
      stanceChanges[c.id] = { from: prev, to: c.stanceTowardsPlayer, name: c.name };
    }
  }

  const STANCE_ORDER = ['Ally', 'Friendly', 'Neutral', 'Suspicious', 'Hostile', 'At War'];

  // ── Global sector momentum this turn ──
  const sectorDrift: Record<string, number> = {};
  for (const sec of Object.keys(SECTOR_BASE_VOL)) {
    sectorDrift[sec] = (Math.random() - 0.48) * 0.03; // slight upward bias
  }

  // War → defense + energy surge
  const warCountries = state.countries.filter(c =>
    c.id !== state.playerCountryId &&
    (c.stanceTowardsPlayer === 'At War' || c.stanceTowardsPlayer === 'Hostile')
  );
  if (warCountries.length > 0) {
    sectorDrift['Defense'] += 0.04;
    sectorDrift['Energy'] += 0.03;
  }

  // ── Rare macro events ──
  if (Math.random() < 0.06) {
    sectorDrift['Tech'] -= 0.08;
    headlines.push('MARKET SHOCK: Global tech selloff triggered by AI regulation fears.');
  }
  if (Math.random() < 0.05) {
    sectorDrift['Energy'] += 0.07;
    headlines.push('OIL SPIKE: Supply disruption drives energy stocks sharply higher.');
  }
  if (Math.random() < 0.04) {
    sectorDrift['Finance'] -= 0.06;
    headlines.push('CREDIT CRISIS: Interbank lending freezes — financial stocks plunge.');
  }
  if (Math.random() < 0.04) {
    for (const k of Object.keys(sectorDrift)) sectorDrift[k] = (sectorDrift[k] ?? 0) - 0.05;
    headlines.push('BLACK SWAN: Global markets rout on systemic risk event. All sectors fall.');
  }

  // ── Tick each stock ──
  const updatedStocks = stocks.map(stock => {
    const vol = SECTOR_BASE_VOL[stock.sector] ?? 0.10;
    const country = state.countries.find(c => c.id === stock.countryId);

    // Base random walk
    let delta = (Math.random() - 0.5) * vol;

    // Sector drift
    delta += sectorDrift[stock.sector] ?? 0;

    // Country stability factor
    if (country) {
      delta += (country.resources.stability - 65) / 2000; // ±1.75% at extremes
    }

    // Diplomatic stance change impact
    const sc = stanceChanges[stock.countryId];
    if (sc) {
      const fromI = STANCE_ORDER.indexOf(sc.from);
      const toI = STANCE_ORDER.indexOf(sc.to);
      const direction = toI - fromI; // positive = worsening
      if (direction > 0) {
        delta -= direction * 0.09;
        headlines.push(
          `${stock.name} (${stock.ticker}) slides as ${sc.name} relations deteriorate.`
        );
      } else if (direction < 0) {
        delta += Math.abs(direction) * 0.06;
        headlines.push(
          `${stock.name} (${stock.ticker}) rallies on improved ${sc.name} diplomatic ties.`
        );
      }
    }

    // Sanctioned / at-war country: chronic downward pressure
    if (
      country &&
      (country.stanceTowardsPlayer === 'Hostile' || country.stanceTowardsPlayer === 'At War') &&
      (stock.countryId === 'russia' || stock.countryId === 'north-korea' || stock.countryId === 'iran')
    ) {
      delta -= 0.015;
    }

    const newCap = Math.max(0.001, Number((stock.marketCap * (1 + delta)).toFixed(4)));
    const changePct = Number((((newCap - stock.marketCap) / stock.marketCap) * 100).toFixed(2));
    const newHistory = [...stock.priceHistory, stock.marketCap].slice(-12);

    return { ...stock, marketCap: newCap, priceHistory: newHistory, changePct };
  });

  // ── Dramatic movers → headlines ──
  const bigMovers = [...updatedStocks]
    .filter(s => Math.abs(s.changePct) > 7)
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, 3);
  for (const m of bigMovers) {
    const arrow = m.changePct > 0 ? '▲' : '▼';
    const sign = m.changePct > 0 ? '+' : '';
    headlines.push(`${m.name} (${m.ticker}) ${arrow} ${sign}${m.changePct.toFixed(1)}%`);
  }

  // ── Mark-to-market: unrealised P&L against open positions ──
  // We don't auto-realize; just inform the player via headlines if big swings
  let portfolioGdpDelta = 0;
  for (const holding of portfolio) {
    const oldStock = stocks.find(s => s.ticker === holding.ticker);
    const newStock = updatedStocks.find(s => s.ticker === holding.ticker);
    if (!oldStock || !newStock) continue;
    const oldValue = holding.invested * (oldStock.marketCap / holding.boughtAt);
    const newValue = holding.invested * (newStock.marketCap / holding.boughtAt);
    portfolioGdpDelta += newValue - oldValue;
  }

  return { updatedStocks, marketHeadlines: headlines.slice(0, 5), portfolioGdpDelta };
}

export function getPortfolioValue(stocks: Stock[], portfolio: StockHolding[]): number {
  return portfolio.reduce((sum, h) => {
    const s = stocks.find(st => st.ticker === h.ticker);
    if (!s) return sum;
    return sum + h.invested * (s.marketCap / h.boughtAt);
  }, 0);
}

export function getPortfolioCost(portfolio: StockHolding[]): number {
  return portfolio.reduce((sum, h) => sum + h.invested, 0);
}
