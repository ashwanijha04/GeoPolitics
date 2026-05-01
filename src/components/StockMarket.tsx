/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, AlertTriangle } from 'lucide-react';
import { GameState, Stock, StockSector } from '../types.ts';
import { getPortfolioValue, getPortfolioCost } from '../stockMarket.ts';

interface Props {
  gameState: GameState;
  playerGdp: number;
  onBuy: (ticker: string, amount: number) => void;
  onSell: (ticker: string) => void;
}

const SECTORS: (StockSector | 'All')[] = ['All', 'Tech', 'Energy', 'Defense', 'Finance', 'Auto', 'Materials', 'Pharma', 'Consumer'];

const SECTOR_COLOR: Record<string, string> = {
  Tech: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Energy: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  Defense: 'text-red-400 bg-red-500/10 border-red-500/20',
  Finance: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  Auto: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Materials: 'text-stone-400 bg-stone-500/10 border-stone-500/20',
  Pharma: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  Consumer: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
};

function Sparkline({ history, changePct }: { history: number[]; changePct: number }) {
  if (history.length < 2) return <div className="w-16 h-6 flex items-center justify-center text-slate-600 text-[9px]">no data</div>;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  const w = 64, h = 24;
  const pts = history.map((v, i) => {
    const x = (i / (history.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const color = changePct >= 0 ? '#34d399' : '#f87171';
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function BuyModal({ stock, maxGdp, onConfirm, onClose }: {
  stock: Stock; maxGdp: number; onConfirm: (amount: number) => void; onClose: () => void;
}) {
  const [amount, setAmount] = useState(0.1);
  const presets = [0.1, 0.5, 1.0, 2.0].filter(p => p <= maxGdp);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-sm w-full bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <TrendingUp size={20} className="text-emerald-400" />
          </div>
          <div>
            <div className="font-black text-white">{stock.name}</div>
            <div className="text-xs text-slate-400">{stock.ticker} · Mkt Cap ${stock.marketCap.toFixed(3)}T</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest">Amount to invest (GDP trillions)</div>
          <div className="flex gap-2 mb-3 flex-wrap">
            {presets.map(p => (
              <button key={p} onClick={() => setAmount(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${amount === p ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-700 text-slate-300 hover:border-emerald-500'}`}>
                ${p}T
              </button>
            ))}
          </div>
          <input type="range" min="0.05" max={Math.min(maxGdp, 5)} step="0.05" value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
          <div className="text-center text-emerald-400 font-black text-lg mt-1">${amount.toFixed(2)}T</div>
        </div>

        <div className="text-xs text-slate-500 mb-5 italic">Returns move proportionally with stock price. Risk: you may lose invested GDP.</div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-800 transition-all">Cancel</button>
          <button onClick={() => { onConfirm(amount); onClose(); }}
            disabled={amount > maxGdp || maxGdp <= 0}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition-all disabled:opacity-40">
            BUY POSITION
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function StockMarket({ gameState, playerGdp, onBuy, onSell }: Props) {
  const [sector, setSector] = useState<StockSector | 'All'>('All');
  const [buyTarget, setBuyTarget] = useState<Stock | null>(null);
  const { stocks, portfolio } = gameState;

  const portfolioValue = getPortfolioValue(stocks, portfolio);
  const portfolioCost  = getPortfolioCost(portfolio);
  const pnl = portfolioValue - portfolioCost;
  const pnlPct = portfolioCost > 0 ? (pnl / portfolioCost) * 100 : 0;

  const totalMktCap = stocks.reduce((s, st) => s + st.marketCap, 0);
  const avgChange = stocks.reduce((s, st) => s + st.changePct, 0) / (stocks.length || 1);

  const visible = sector === 'All' ? stocks : stocks.filter(s => s.sector === sector);
  const sortedVisible = [...visible].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));

  const maxBuy = Math.max(0, playerGdp * 0.25 - portfolioCost);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Global Markets</h2>
          <p className="text-slate-400 text-sm">Real-time geopolitical risk reflected in equity prices. Buy positions, hedge your wars.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-center min-w-[110px]">
            <div className="text-[9px] uppercase text-slate-500 font-black tracking-widest mb-0.5">World Mkt Cap</div>
            <div className="text-base font-black text-white">${totalMktCap.toFixed(2)}T</div>
          </div>
          <div className={`px-4 py-3 bg-slate-900 border rounded-xl text-center min-w-[90px] ${avgChange >= 0 ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
            <div className="text-[9px] uppercase text-slate-500 font-black tracking-widest mb-0.5">Avg Move</div>
            <div className={`text-base font-black ${avgChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
            </div>
          </div>
          <div className={`px-4 py-3 bg-slate-900 border rounded-xl text-center min-w-[110px] ${pnl >= 0 ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
            <div className="text-[9px] uppercase text-slate-500 font-black tracking-widest mb-0.5">Portfolio P&L</div>
            <div className={`text-base font-black ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}T
            </div>
            <div className={`text-[9px] ${pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Holdings */}
      {portfolio.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} className="text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Your Holdings</span>
            <div className="h-px flex-1 bg-blue-900/30" />
            <span className="text-xs text-slate-400">Max invest: ${maxBuy.toFixed(2)}T remaining</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {portfolio.map(h => {
              const s = stocks.find(st => st.ticker === h.ticker);
              if (!s) return null;
              const cur = h.invested * (s.marketCap / h.boughtAt);
              const gain = cur - h.invested;
              const gainPct = (gain / h.invested) * 100;
              return (
                <div key={h.ticker} className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${gain >= 0 ? 'border-emerald-500/20 bg-emerald-950/10' : 'border-red-500/20 bg-red-950/10'}`}>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-white text-sm">{s.ticker}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${SECTOR_COLOR[s.sector] ?? ''}`}>{s.sector}</span>
                    </div>
                    <div className="text-xs text-slate-400">${cur.toFixed(3)}T · cost ${h.invested.toFixed(2)}T</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-right text-sm font-black ${gain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {gain >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
                    </div>
                    <button onClick={() => onSell(h.ticker)}
                      className="px-2 py-1 rounded-lg border border-red-500/30 text-red-400 text-[9px] font-black uppercase hover:bg-red-500/10 transition-all">
                      SELL
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {maxBuy <= 0 && portfolio.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-amber-400 text-xs">
          <AlertTriangle size={14} />
          Portfolio cap reached (25% of GDP). Sell positions to free capital.
        </div>
      )}

      {/* Sector filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {SECTORS.map(s => (
          <button key={s} onClick={() => setSector(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${sector === s ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Stock grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <AnimatePresence mode="popLayout">
          {sortedVisible.map(stock => {
            const country = gameState.countries.find(c => c.id === stock.countryId);
            const holding = portfolio.find(h => h.ticker === stock.ticker);
            const isUp = stock.changePct >= 0;
            const isHeld = !!holding;
            const isHostile = country?.stanceTowardsPlayer === 'Hostile' || country?.stanceTowardsPlayer === 'At War';

            return (
              <motion.div
                key={stock.ticker}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-2xl border transition-all ${isHeld ? 'border-blue-500/40 bg-blue-950/10' : isHostile ? 'border-red-900/30 bg-red-950/5' : 'border-slate-800 bg-slate-900/50'} hover:border-slate-600`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-black text-white text-sm truncate">{stock.ticker}</span>
                      {country && <span className="text-base leading-none">{country.flag}</span>}
                      {isHostile && <span className="text-[8px] text-red-500 font-bold uppercase">SANCTIONED</span>}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{stock.name}</div>
                  </div>
                  <div className={`flex flex-col items-end ml-2 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                    <div className="flex items-center gap-0.5 font-black text-sm">
                      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {isUp ? '+' : ''}{stock.changePct.toFixed(2)}%
                    </div>
                    <div className="text-[10px] text-slate-500">${stock.marketCap.toFixed(3)}T</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${SECTOR_COLOR[stock.sector] ?? 'text-slate-400'}`}>
                    {stock.sector}
                  </span>
                  <Sparkline history={stock.priceHistory} changePct={stock.changePct} />
                </div>

                {isHeld ? (
                  <button onClick={() => onSell(stock.ticker)}
                    className="w-full py-2 rounded-xl border border-red-500/30 text-red-400 text-[10px] font-black uppercase hover:bg-red-500/10 transition-all">
                    Close Position
                  </button>
                ) : (
                  <button
                    onClick={() => setBuyTarget(stock)}
                    disabled={maxBuy <= 0}
                    className="w-full py-2 rounded-xl border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase hover:bg-emerald-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <DollarSign size={11} /> Invest
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Buy modal */}
      <AnimatePresence>
        {buyTarget && (
          <BuyModal
            stock={buyTarget}
            maxGdp={maxBuy}
            onConfirm={(amount) => onBuy(buyTarget.ticker, amount)}
            onClose={() => setBuyTarget(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
