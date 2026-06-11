import { useEffect, useMemo, useRef, useState } from 'react';
import { useGalleryStore } from '../../stores/galleryStore';
import { formatPrice, formatPercentage } from '../../utils/formatters';

const MAX_RESULTS = 8;

export const SearchOverlay = () => {
  const isSearchOpen = useGalleryStore((s) => s.isSearchOpen);
  const setSearchOpen = useGalleryStore((s) => s.setSearchOpen);
  const tokens = useGalleryStore((s) => s.tokens);
  const teleportToToken = useGalleryStore((s) => s.teleportToToken);

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset and focus when opened
  useEffect(() => {
    if (isSearchOpen) {
      setQuery('');
      setActiveIndex(0);
      // Delay so the global "/" keydown doesn't get typed into the input
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isSearchOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tokens.slice(0, MAX_RESULTS);
    return tokens
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) || t.symbol.toLowerCase().includes(q)
      )
      .slice(0, MAX_RESULTS);
  }, [query, tokens]);

  if (!isSearchOpen) return null;

  const goTo = (tokenId: string) => {
    teleportToToken(tokenId);
    setSearchOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      goTo(results[activeIndex].id);
    } else if (e.key === 'Escape') {
      setSearchOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={() => setSearchOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Search tokens"
    >
      <div
        className="w-full max-w-lg mx-4 bg-cyber-primary border border-neon-cyan/50 rounded-xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neon-cyan/20">
          <svg className="w-5 h-5 text-neon-cyan shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search by name or symbol…"
            aria-label="Search tokens by name or symbol"
            className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 bg-cyber-secondary border border-gray-600 rounded text-gray-300 text-xs font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <ul role="listbox" aria-label="Search results" className="max-h-[50vh] overflow-y-auto">
            {results.map((token, i) => {
              const change = token.price_change_percentage_24h ?? 0;
              return (
                <li key={token.id} role="option" aria-selected={i === activeIndex}>
                  <button
                    onClick={() => goTo(token.id)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === activeIndex ? 'bg-neon-cyan/10' : 'hover:bg-cyber-secondary/50'
                    }`}
                  >
                    <span className="text-gray-400 text-xs font-mono w-8 shrink-0">
                      #{token.market_cap_rank ?? '—'}
                    </span>
                    <img src={token.image} alt="" className="w-7 h-7 rounded-full shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="text-white font-semibold">{token.symbol.toUpperCase()}</span>
                      <span className="text-gray-400 text-sm ml-2 truncate">{token.name}</span>
                    </span>
                    <span className="text-right shrink-0">
                      <span className="block text-neon-cyan font-mono text-sm">
                        {formatPrice(token.current_price)}
                      </span>
                      <span
                        className={`block text-xs font-mono ${
                          change >= 0 ? 'text-pump-green' : 'text-dump-red'
                        }`}
                      >
                        {formatPercentage(change)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">
            No tokens match “{query}”.
            <br />
            <span className="text-xs text-gray-500">Try a different name or symbol.</span>
          </div>
        )}

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-neon-cyan/10 text-xs text-gray-400 flex gap-4">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">Enter</kbd> teleport</span>
        </div>
      </div>
    </div>
  );
};
