import { useGalleryStore } from '../../stores/galleryStore';
import { formatPrice, formatMarketCap } from '../../utils/formatters';

export const TokenDetailPanel = () => {
  const selectedToken = useGalleryStore((s) => s.selectedToken);
  const selectToken = useGalleryStore((s) => s.selectToken);

  if (!selectedToken) return null;

  const token = selectedToken;
  const priceChange = token.price_change_percentage_24h ?? 0;
  const priceChangeColor = priceChange >= 0 ? 'text-pump-green' : 'text-dump-red';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-cyber-primary border border-neon-cyan/50 rounded-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={() => selectToken(null)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={token.image}
            alt={token.name}
            className="w-16 h-16 rounded-full border-2 border-neon-cyan/50"
          />
          <div>
            <h2 className="text-white font-bold text-2xl">
              {token.symbol.toUpperCase()}
            </h2>
            <p className="text-gray-400">{token.name}</p>
            {token.market_cap_rank && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-neon-gold/20 text-neon-gold text-xs rounded">
                Rank #{token.market_cap_rank}
              </span>
            )}
          </div>
        </div>

        {/* Price section */}
        <div className="mb-6">
          <div className="text-3xl font-bold text-neon-cyan font-mono">
            {formatPrice(token.current_price)}
          </div>
          <div className={`text-lg font-mono ${priceChangeColor}`}>
            {priceChange >= 0 ? '▲' : '▼'}{' '}
            {Math.abs(priceChange).toFixed(2)}%
            <span className="text-gray-400 text-sm ml-2">24h</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatItem label="Market Cap" value={formatMarketCap(token.market_cap)} />
          <StatItem label="Volume 24h" value={formatMarketCap(token.total_volume)} />
          <StatItem label="24h High" value={formatPrice(token.high_24h)} />
          <StatItem label="24h Low" value={formatPrice(token.low_24h)} />
          <StatItem label="ATH" value={formatPrice(token.ath)} />
          <StatItem label="ATL" value={formatPrice(token.atl)} />
        </div>

        {/* Sparkline placeholder */}
        {token.sparkline_in_7d && (
          <div className="mb-6">
            <h3 className="text-gray-400 text-sm mb-2">7 Day Price</h3>
            <Sparkline data={token.sparkline_in_7d.price} />
          </div>
        )}

        {/* Links */}
        <div className="flex gap-3">
          <a
            href={`https://www.coingecko.com/en/coins/${token.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 px-4 bg-neon-cyan/20 border border-neon-cyan/50 rounded-lg text-neon-cyan text-center hover:bg-neon-cyan/30 transition-colors"
          >
            View on CoinGecko
          </a>
        </div>

        {/* Close hint */}
        <p className="text-center text-gray-500 text-xs mt-4">
          Press ESC to close
        </p>
      </div>
    </div>
  );
};

const StatItem = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-cyber-secondary/50 rounded-lg p-3">
    <div className="text-gray-400 text-xs mb-1">{label}</div>
    <div className="text-white font-mono">{value}</div>
  </div>
);

// Simple sparkline component
const Sparkline = ({ data }: { data: number[] }) => {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  const isPositive = data[data.length - 1] >= data[0];
  const color = isPositive ? '#00ff88' : '#ff4757';

  return (
    <svg viewBox="0 0 100 50" className="w-full h-16">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};
