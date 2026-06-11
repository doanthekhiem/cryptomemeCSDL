import { useMemo, useState } from 'react';
import { useGalleryStore } from '../../stores/galleryStore';
import { MemeToken } from '../../types';
import { formatPrice, formatMarketCap, formatPercentage } from '../../utils/formatters';

type SortKey = 'rank' | 'price' | 'change_desc' | 'change_asc' | 'mcap';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'rank', label: 'Rank' },
  { value: 'mcap', label: 'Market cap' },
  { value: 'price', label: 'Price' },
  { value: 'change_desc', label: 'Top gainers (24h)' },
  { value: 'change_asc', label: 'Top losers (24h)' },
];

const sortTokens = (tokens: MemeToken[], key: SortKey): MemeToken[] => {
  const sorted = [...tokens];
  switch (key) {
    case 'rank':
      return sorted.sort(
        (a, b) => (a.market_cap_rank ?? Infinity) - (b.market_cap_rank ?? Infinity)
      );
    case 'mcap':
      return sorted.sort((a, b) => (b.market_cap ?? 0) - (a.market_cap ?? 0));
    case 'price':
      return sorted.sort((a, b) => (b.current_price ?? 0) - (a.current_price ?? 0));
    case 'change_desc':
      return sorted.sort(
        (a, b) =>
          (b.price_change_percentage_24h ?? -Infinity) -
          (a.price_change_percentage_24h ?? -Infinity)
      );
    case 'change_asc':
      return sorted.sort(
        (a, b) =>
          (a.price_change_percentage_24h ?? Infinity) -
          (b.price_change_percentage_24h ?? Infinity)
      );
  }
};

// Classic 2D grid of all tokens. Doubles as the accessible / low-end-device
// alternative to the 3D gallery.
export const ListView = () => {
  const isListViewOpen = useGalleryStore((s) => s.isListViewOpen);
  const setListViewOpen = useGalleryStore((s) => s.setListViewOpen);
  const tokens = useGalleryStore((s) => s.tokens);
  const selectToken = useGalleryStore((s) => s.selectToken);
  const teleportToToken = useGalleryStore((s) => s.teleportToToken);
  const watchlist = useGalleryStore((s) => s.watchlist);
  const toggleWatchlist = useGalleryStore((s) => s.toggleWatchlist);

  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [watchlistOnly, setWatchlistOnly] = useState(false);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    let filtered = q
      ? tokens.filter(
          (t) =>
            t.name.toLowerCase().includes(q) || t.symbol.toLowerCase().includes(q)
        )
      : tokens;
    if (watchlistOnly) {
      filtered = filtered.filter((t) => watchlist.includes(t.id));
    }
    return sortTokens(filtered, sortKey);
  }, [tokens, filter, sortKey, watchlistOnly, watchlist]);

  if (!isListViewOpen) return null;

  const openToken = (token: MemeToken) => {
    teleportToToken(token.id); // so closing the modal leaves you at the token in 3D
    selectToken(token);
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-cyber-bg/95 backdrop-blur-sm flex flex-col animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Token list"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-neon-cyan/20">
        <h2 className="text-lg font-bold text-white mr-auto">
          <span className="text-neon-cyan">TOKEN</span> LIST
          <span className="ml-2 text-sm font-normal text-gray-400">
            {visible.length} / {tokens.length}
          </span>
        </h2>

        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter…"
          aria-label="Filter tokens"
          className="px-3 py-1.5 bg-cyber-primary border border-neon-cyan/30 rounded-lg text-sm text-white placeholder-gray-400 focus:border-neon-cyan focus:outline-none w-40 sm:w-56"
        />

        <button
          onClick={() => setWatchlistOnly((w) => !w)}
          aria-pressed={watchlistOnly}
          title="Show only watchlisted tokens"
          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
            watchlistOnly
              ? 'bg-neon-gold/20 border-neon-gold text-neon-gold'
              : 'bg-cyber-primary border-neon-cyan/30 text-gray-300 hover:border-neon-gold/60'
          }`}
        >
          ★ {watchlist.length}
        </button>

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          aria-label="Sort tokens"
          className="px-3 py-1.5 bg-cyber-primary border border-neon-cyan/30 rounded-lg text-sm text-white focus:border-neon-cyan focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => setListViewOpen(false)}
          aria-label="Close token list"
          className="px-3 py-1.5 bg-neon-cyan/15 border border-neon-cyan/50 rounded-lg text-neon-cyan text-sm hover:bg-neon-cyan/25 transition-colors"
        >
          Back to 3D
        </button>
      </div>

      {/* Grid */}
      {visible.length > 0 ? (
        <div className="flex-1 overflow-y-auto p-4 pb-safe">
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {visible.map((token) => {
              const change = token.price_change_percentage_24h ?? 0;
              const isWatched = watchlist.includes(token.id);
              return (
                <li key={token.id}>
                  {/* div+role instead of <button> — the star is a nested control */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => openToken(token)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openToken(token);
                      }
                    }}
                    aria-label={`View ${token.name} details`}
                    className="relative w-full h-full p-3 bg-cyber-primary/80 border border-neon-cyan/20 hover:border-neon-cyan/60 rounded-xl text-left transition-colors group cursor-pointer"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlist(token.id);
                      }}
                      aria-label={
                        isWatched
                          ? `Remove ${token.symbol} from watchlist`
                          : `Add ${token.symbol} to watchlist`
                      }
                      aria-pressed={isWatched}
                      className={`absolute top-2 right-2 text-base leading-none transition-colors ${
                        isWatched ? 'text-neon-gold' : 'text-gray-600 hover:text-neon-gold'
                      }`}
                    >
                      {isWatched ? '★' : '☆'}
                    </button>

                    <div className="flex items-center gap-2 mb-2 pr-5">
                      <img
                        src={token.image}
                        alt=""
                        loading="lazy"
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="min-w-0">
                        <div className="text-white font-semibold text-sm truncate group-hover:text-neon-cyan transition-colors">
                          {token.symbol.toUpperCase()}
                        </div>
                        <div className="text-gray-400 text-xs truncate">{token.name}</div>
                      </div>
                      <span className="ml-auto text-gray-500 text-xs font-mono shrink-0">
                        #{token.market_cap_rank ?? '—'}
                      </span>
                    </div>
                    <div className="font-mono text-sm text-neon-cyan">
                      {formatPrice(token.current_price)}
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span
                        className={`font-mono text-xs ${
                          change >= 0 ? 'text-pump-green' : 'text-dump-red'
                        }`}
                      >
                        {formatPercentage(change)}
                      </span>
                      <span className="text-gray-400 text-xs font-mono">
                        {formatMarketCap(token.market_cap)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center text-gray-400 text-sm px-4">
          {watchlistOnly && watchlist.length === 0 ? (
            <div>
              Your watchlist is empty.
              <br />
              <span className="text-xs text-gray-500">
                Tap the ☆ on any token card to start watching it.
              </span>
            </div>
          ) : (
            <div>
              No tokens match {filter ? `“${filter}”` : 'the current filters'}.
              <br />
              <span className="text-xs text-gray-500">Try a different name or symbol.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
