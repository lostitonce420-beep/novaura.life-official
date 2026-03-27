import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, RefreshCw, Search, Star,
  DollarSign, BarChart3, ArrowUpRight, ArrowDownRight,
  Loader2, Clock, Coins, Activity,
} from 'lucide-react';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

async function fetchTopCoins(page = 1, perPage = 50) {
  const res = await fetch(
    `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=1h,24h,7d`
  );
  if (!res.ok) throw new Error('API rate limited — try again in a moment');
  return res.json();
}

async function fetchTrending() {
  const res = await fetch(`${COINGECKO_BASE}/search/trending`);
  if (!res.ok) throw new Error('Failed to fetch trending');
  return res.json();
}

async function fetchGlobalData() {
  const res = await fetch(`${COINGECKO_BASE}/global`);
  if (!res.ok) throw new Error('Failed to fetch global data');
  return res.json();
}

function formatPrice(price) {
  if (!price && price !== 0) return '—';
  if (price >= 1) return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 0.01) return '$' + price.toFixed(4);
  return '$' + price.toFixed(8);
}

function formatLargeNum(num) {
  if (!num) return '—';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

function PctChange({ value, className = '' }) {
  if (value == null) return <span className="text-gray-500">—</span>;
  const positive = value >= 0;
  return (
    <span className={`flex items-center gap-0.5 ${positive ? 'text-green-400' : 'text-red-400'} ${className}`}>
      {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value).toFixed(2)}%
    </span>
  );
}

function MiniSparkline({ data, color = '#22d3ee', width = 80, height = 24 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
}

export default function CryptoWindow() {
  const [coins, setCoins] = useState([]);
  const [trending, setTrending] = useState([]);
  const [global, setGlobal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('novaura_crypto_favs') || '[]'); } catch { return []; }
  });
  const [tab, setTab] = useState('market');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [coinsData, trendingData, globalData] = await Promise.all([
        fetchTopCoins(),
        fetchTrending().catch(() => ({ coins: [] })),
        fetchGlobalData().catch(() => null),
      ]);
      setCoins(coinsData);
      setTrending(trendingData.coins || []);
      if (globalData) setGlobal(globalData.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, [loadData]);

  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('novaura_crypto_favs', JSON.stringify(next));
      return next;
    });
  };

  const filteredCoins = coins.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const favCoins = coins.filter(c => favorites.includes(c.id));

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-gray-200">Crypto Markets</h2>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-[10px] text-gray-600 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button onClick={loadData} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global stats */}
        {global && (
          <div className="flex gap-3 text-[10px] mb-2">
            <span className="text-gray-500">Market Cap: <span className="text-gray-300">{formatLargeNum(global.total_market_cap?.usd)}</span></span>
            <span className="text-gray-500">24h Vol: <span className="text-gray-300">{formatLargeNum(global.total_volume?.usd)}</span></span>
            <span className="text-gray-500">BTC: <span className="text-gray-300">{global.market_cap_percentage?.btc?.toFixed(1)}%</span></span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-2">
          {[
            { id: 'market', label: 'Market', icon: BarChart3 },
            { id: 'trending', label: 'Trending', icon: TrendingUp },
            { id: 'favorites', label: 'Watchlist', icon: Star },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                tab === t.id ? 'bg-primary/20 text-primary' : 'text-gray-500 hover:bg-white/5'
              }`}
            >
              <t.icon className="w-3 h-3" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        {tab === 'market' && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search coins..."
              className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/[0.06] rounded-lg text-[11px] text-gray-200 placeholder-gray-600 outline-none focus:border-primary/30"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading && coins.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
            <Activity className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">{error}</p>
            <button onClick={loadData} className="mt-2 text-xs text-primary hover:underline">Retry</button>
          </div>
        ) : (
          <>
            {/* Market tab */}
            {tab === 'market' && (
              <div>
                {/* Column header */}
                <div className="flex items-center px-4 py-1.5 text-[9px] text-gray-600 uppercase tracking-wider border-b border-white/[0.04] sticky top-0 bg-[#0a0a0f] z-10">
                  <span className="w-8">#</span>
                  <span className="flex-1">Coin</span>
                  <span className="w-24 text-right">Price</span>
                  <span className="w-16 text-right">24h</span>
                  <span className="w-20 text-right hidden sm:block">7d Chart</span>
                  <span className="w-24 text-right hidden sm:block">Market Cap</span>
                  <span className="w-6" />
                </div>
                {filteredCoins.map((coin) => (
                  <div key={coin.id} className="flex items-center px-4 py-2 hover:bg-white/[0.02] transition-colors border-b border-white/[0.02]">
                    <span className="w-8 text-[10px] text-gray-600">{coin.market_cap_rank}</span>
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <img src={coin.image} alt={coin.symbol} className="w-6 h-6 rounded-full" loading="lazy" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">{coin.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{coin.symbol}</p>
                      </div>
                    </div>
                    <span className="w-24 text-right text-sm font-medium text-gray-200">{formatPrice(coin.current_price)}</span>
                    <span className="w-16 text-right text-[11px]">
                      <PctChange value={coin.price_change_percentage_24h} />
                    </span>
                    <span className="w-20 text-right hidden sm:flex justify-end">
                      <MiniSparkline
                        data={coin.sparkline_in_7d?.price}
                        color={coin.price_change_percentage_7d_in_currency >= 0 ? '#4ade80' : '#f87171'}
                      />
                    </span>
                    <span className="w-24 text-right text-[10px] text-gray-500 hidden sm:block">{formatLargeNum(coin.market_cap)}</span>
                    <button onClick={() => toggleFavorite(coin.id)} className="w-6 flex justify-center">
                      <Star className={`w-3.5 h-3.5 ${favorites.includes(coin.id) ? 'text-yellow-400 fill-current' : 'text-gray-600 hover:text-gray-400'}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Trending tab */}
            {tab === 'trending' && (
              <div className="p-4 space-y-2">
                <p className="text-xs text-gray-500 mb-3">Trending on CoinGecko in the last 24h</p>
                {trending.map((item, i) => {
                  const coin = item.item;
                  return (
                    <div key={coin.id} className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.03] rounded-xl hover:bg-white/[0.05]">
                      <span className="text-xs font-bold text-gray-500 w-5">{i + 1}</span>
                      <img src={coin.thumb} alt={coin.symbol} className="w-7 h-7 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200">{coin.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{coin.symbol} — Rank #{coin.market_cap_rank || '?'}</p>
                      </div>
                      {coin.data?.price && (
                        <span className="text-sm text-gray-300">{formatPrice(parseFloat(coin.data.price))}</span>
                      )}
                    </div>
                  );
                })}
                {trending.length === 0 && (
                  <div className="text-center text-gray-600 py-8">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No trending data available</p>
                  </div>
                )}
              </div>
            )}

            {/* Favorites/Watchlist tab */}
            {tab === 'favorites' && (
              <div className="p-4">
                {favCoins.length === 0 ? (
                  <div className="text-center text-gray-600 py-12">
                    <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No coins in your watchlist</p>
                    <p className="text-xs text-gray-700 mt-1">Star coins from the Market tab to track them here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {favCoins.map(coin => (
                      <div key={coin.id} className="flex items-center gap-3 px-3 py-3 bg-white/[0.03] rounded-xl">
                        <img src={coin.image} alt={coin.symbol} className="w-8 h-8 rounded-full" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-200">{coin.name}</p>
                            <span className="text-[10px] text-gray-500 uppercase">{coin.symbol}</span>
                          </div>
                          <p className="text-xs text-gray-500">Cap: {formatLargeNum(coin.market_cap)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-200">{formatPrice(coin.current_price)}</p>
                          <PctChange value={coin.price_change_percentage_24h} className="text-[11px] justify-end" />
                        </div>
                        <button onClick={() => toggleFavorite(coin.id)}>
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
