import { useMemo } from 'react';
import { useGalleryStore } from '../../stores/galleryStore';
import { MemeToken } from '../../types';
import { formatPrice, formatPercentage } from '../../utils/formatters';

const TOP_N = 5;

export const Leaderboard = () => {
  const isLeaderboardOpen = useGalleryStore((s) => s.isLeaderboardOpen);
  const setLeaderboardOpen = useGalleryStore((s) => s.setLeaderboardOpen);
  const tokens = useGalleryStore((s) => s.tokens);
  const teleportToToken = useGalleryStore((s) => s.teleportToToken);
  const selectToken = useGalleryStore((s) => s.selectToken);

  const { gainers, losers } = useMemo(() => {
    const ranked = [...tokens].sort(
      (a, b) =>
        (b.price_change_percentage_24h ?? -Infinity) -
        (a.price_change_percentage_24h ?? -Infinity)
    );
    return {
      gainers: ranked.slice(0, TOP_N),
      losers: ranked.slice(-TOP_N).reverse(),
    };
  }, [tokens]);

  if (!isLeaderboardOpen) return null;

  const openToken = (token: MemeToken) => {
    setLeaderboardOpen(false);
    teleportToToken(token.id);
    selectToken(token);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={() => setLeaderboardOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="24h leaderboard"
    >
      <div
        className="w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto bg-cyber-primary border border-neon-cyan/50 rounded-xl p-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">
            <span className="text-neon-gold">24H</span> LEADERBOARD
          </h2>
          <button
            onClick={() => setLeaderboardOpen(false)}
            aria-label="Close leaderboard"
            className="p-1 rounded text-gray-300 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <Board
            title="Top gainers"
            titleColor="text-pump-green"
            tokens={gainers}
            onPick={openToken}
          />
          <Board
            title="Top losers"
            titleColor="text-dump-red"
            tokens={losers}
            onPick={openToken}
          />
        </div>

        <p className="text-center text-gray-400 text-xs mt-4">
          Click a token to travel to it · ESC to close
        </p>
      </div>
    </div>
  );
};

const Board = ({
  title,
  titleColor,
  tokens,
  onPick,
}: {
  title: string;
  titleColor: string;
  tokens: MemeToken[];
  onPick: (token: MemeToken) => void;
}) => (
  <section>
    <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${titleColor}`}>
      {title}
    </h3>
    <ol className="space-y-1.5">
      {tokens.map((token, i) => {
        const change = token.price_change_percentage_24h ?? 0;
        return (
          <li key={token.id}>
            <button
              onClick={() => onPick(token)}
              className="w-full flex items-center gap-2.5 px-3 py-2 bg-cyber-secondary/50 hover:bg-cyber-secondary border border-transparent hover:border-neon-cyan/40 rounded-lg text-left transition-colors"
            >
              <span className="text-gray-400 text-xs font-mono w-4 shrink-0">{i + 1}</span>
              <img src={token.image} alt="" className="w-7 h-7 rounded-full shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="block text-white text-sm font-semibold truncate">
                  {token.symbol.toUpperCase()}
                </span>
                <span className="block text-gray-400 text-xs font-mono">
                  {formatPrice(token.current_price)}
                </span>
              </span>
              <span
                className={`font-mono text-sm shrink-0 ${
                  change >= 0 ? 'text-pump-green' : 'text-dump-red'
                }`}
              >
                {formatPercentage(change)}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  </section>
);
