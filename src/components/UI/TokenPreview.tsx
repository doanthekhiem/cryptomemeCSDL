import { useGalleryStore } from '../../stores/galleryStore';
import { formatPrice, formatMarketCap } from '../../utils/formatters';

export const TokenPreview = () => {
  const nearestToken = useGalleryStore((s) => s.nearestToken);

  if (!nearestToken) return null;

  const { token } = nearestToken;
  const priceChange = token.price_change_percentage_24h ?? 0;
  const priceChangeColor = priceChange >= 0 ? 'text-pump-green' : 'text-dump-red';

  return (
    <div className="fixed bottom-4 left-4 bg-cyber-primary/90 backdrop-blur-sm border border-neon-cyan/50 rounded-lg p-4 min-w-[200px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={token.image}
          alt={token.name}
          className="w-10 h-10 rounded-full"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%2300fff5"/></svg>';
          }}
        />
        <div>
          <h3 className="text-white font-bold text-lg">
            {token.symbol.toUpperCase()}
          </h3>
          <p className="text-gray-400 text-xs">{token.name}</p>
        </div>
      </div>

      {/* Price info */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">Price</span>
          <span className="text-neon-cyan font-mono">
            {formatPrice(token.current_price)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">24h</span>
          <span className={`font-mono ${priceChangeColor}`}>
            {priceChange >= 0 ? '+' : ''}
            {priceChange.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">MCap</span>
          <span className="text-white font-mono text-sm">
            {formatMarketCap(token.market_cap)}
          </span>
        </div>
      </div>

      {/* Action hint */}
      <div className="mt-3 pt-3 border-t border-neon-cyan/20 text-center">
        <span className="text-neon-cyan text-xs">
          Press <span className="font-bold">Enter</span> for details
        </span>
      </div>
    </div>
  );
};
