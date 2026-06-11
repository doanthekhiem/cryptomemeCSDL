import { useState } from 'react';
import { useGalleryStore } from '../../stores/galleryStore';
import { formatPrice, formatMarketCap, formatPercentage } from '../../utils/formatters';
import { isTouchDevice } from '../../utils/inputState';

export const TokenPreview = () => {
  const nearestToken = useGalleryStore((s) => s.nearestToken);
  const selectToken = useGalleryStore((s) => s.selectToken);
  const [isTouch] = useState(isTouchDevice);

  if (!nearestToken) return null;

  const { token } = nearestToken;
  const priceChange = token.price_change_percentage_24h ?? 0;
  const priceChangeColor = priceChange >= 0 ? 'text-pump-green' : 'text-dump-red';

  return (
    // key re-mounts the card when the nearest token changes → entry animation
    <button
      key={token.id}
      onClick={() => selectToken(token)}
      aria-label={`View details for ${token.name}`}
      className="fixed z-30 bottom-0 left-0 right-0 sm:bottom-4 sm:left-4 sm:right-auto sm:min-w-[220px]
        bg-cyber-primary/90 backdrop-blur-sm border-t sm:border border-neon-cyan/50 sm:rounded-lg
        p-3 sm:p-4 pb-safe text-left animate-slide-up hover:border-neon-cyan transition-colors"
    >
      <div className="flex items-center gap-3 sm:mb-3">
        <img
          src={token.image}
          alt=""
          className="w-10 h-10 rounded-full shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%2300fff5"/></svg>';
          }}
        />
        <div className="min-w-0">
          <h3 className="text-white font-bold text-base sm:text-lg leading-tight">
            {token.symbol.toUpperCase()}
            <span className="ml-2 text-gray-400 text-xs font-normal">
              #{token.market_cap_rank ?? '—'}
            </span>
          </h3>
          <p className="text-gray-300 text-xs truncate">{token.name}</p>
        </div>

        {/* Compact price block — sits inline on mobile, below on desktop */}
        <div className="ml-auto text-right sm:hidden">
          <div className="text-neon-cyan font-mono text-sm">{formatPrice(token.current_price)}</div>
          <div className={`font-mono text-xs ${priceChangeColor}`}>
            {formatPercentage(priceChange)}
          </div>
        </div>
      </div>

      {/* Full price info — desktop only */}
      <div className="hidden sm:block space-y-1">
        <div className="flex justify-between gap-6">
          <span className="text-gray-300 text-sm">Price</span>
          <span className="text-neon-cyan font-mono">{formatPrice(token.current_price)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-gray-300 text-sm">24h</span>
          <span className={`font-mono ${priceChangeColor}`}>{formatPercentage(priceChange)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-gray-300 text-sm">MCap</span>
          <span className="text-white font-mono text-sm">{formatMarketCap(token.market_cap)}</span>
        </div>
      </div>

      {/* Action hint */}
      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-neon-cyan/20 text-center">
        <span className="text-neon-cyan text-xs">
          {isTouch ? (
            <>Tap for details</>
          ) : (
            <>
              Press <span className="font-bold">Enter</span> for details
            </>
          )}
        </span>
      </div>
    </button>
  );
};
