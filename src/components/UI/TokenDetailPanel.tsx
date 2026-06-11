import { useEffect, useMemo, useRef, useState } from 'react';
import { useGalleryStore } from '../../stores/galleryStore';
import { useTokenDetail } from '../../hooks/useMemeTokens';
import {
  formatPrice,
  formatMarketCap,
  formatNumber,
  formatPercentage,
} from '../../utils/formatters';

export const TokenDetailPanel = () => {
  const selectedToken = useGalleryStore((s) => s.selectedToken);
  const selectToken = useGalleryStore((s) => s.selectToken);
  const watchlist = useGalleryStore((s) => s.watchlist);
  const toggleWatchlist = useGalleryStore((s) => s.toggleWatchlist);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Extended profile (description, links, community) — fetched lazily per token
  const { data: detail, isLoading: detailLoading } = useTokenDetail(
    selectedToken?.id ?? null
  );

  // Move keyboard focus into the dialog when it opens
  useEffect(() => {
    if (selectedToken) {
      closeButtonRef.current?.focus();
    }
  }, [selectedToken]);

  if (!selectedToken) return null;

  const token = selectedToken;
  const priceChange = token.price_change_percentage_24h ?? 0;
  const priceChangeColor = priceChange >= 0 ? 'text-pump-green' : 'text-dump-red';
  const isWatched = watchlist.includes(token.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={() => selectToken(null)}
      role="dialog"
      aria-modal="true"
      aria-label={`${token.name} details`}
    >
      <div
        className="relative bg-cyber-primary border border-neon-cyan/50 rounded-xl p-6 max-w-md w-full mx-4 max-h-[85vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Meme moment: big pump gets a stamp + one confetti burst */}
        {priceChange > 20 && <MoonCelebration key={token.id} />}

        {/* Watchlist + close buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-1">
          <button
            onClick={() => toggleWatchlist(token.id)}
            aria-label={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
            aria-pressed={isWatched}
            title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
            className={`p-1 rounded transition-colors ${
              isWatched ? 'text-neon-gold' : 'text-gray-400 hover:text-neon-gold'
            }`}
          >
            <svg
              className="w-6 h-6"
              fill={isWatched ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M11.48 3.5c.16-.5.88-.5 1.04 0l1.9 5.83a.55.55 0 00.52.38h6.13c.53 0 .75.67.32.98l-4.96 3.6a.55.55 0 00-.2.62l1.9 5.83c.16.5-.41.92-.84.6l-4.96-3.6a.55.55 0 00-.65 0l-4.96 3.6c-.43.32-1-.1-.84-.6l1.9-5.83a.55.55 0 00-.2-.61l-4.96-3.61c-.43-.31-.21-.98.32-.98h6.13a.55.55 0 00.52-.38l1.9-5.83z"
              />
            </svg>
          </button>
          <button
            ref={closeButtonRef}
            onClick={() => selectToken(null)}
            aria-label="Close details"
            className="p-1 rounded text-gray-300 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

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
            <p className="text-gray-300">{token.name}</p>
            <span className="inline-flex flex-wrap items-center gap-1.5 mt-1">
              {token.market_cap_rank && (
                <span className="px-2 py-0.5 bg-neon-gold/20 text-neon-gold text-xs rounded">
                  Rank #{token.market_cap_rank}
                </span>
              )}
              {/* Proof-of-Culture placeholder — wired to the real system later */}
              <span
                className="px-2 py-0.5 bg-cyber-secondary text-gray-400 text-xs rounded border border-gray-600/50 cursor-help"
                title="Proof-of-Culture verification — coming soon to CryptoMeme.org"
              >
                ◈ Culture Seal: pending
              </span>
            </span>
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
            <span className="text-gray-300 text-sm ml-2">24h</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatItem
            label="Market Cap"
            value={formatMarketCap(token.market_cap)}
            fullValue={token.market_cap != null ? `$${formatNumber(token.market_cap)}` : undefined}
          />
          <StatItem
            label="Volume 24h"
            value={formatMarketCap(token.total_volume)}
            fullValue={token.total_volume != null ? `$${formatNumber(token.total_volume)}` : undefined}
          />
          <StatItem label="24h High" value={formatPrice(token.high_24h)} />
          <StatItem label="24h Low" value={formatPrice(token.low_24h)} />
          <StatItem
            label="ATH"
            value={formatPrice(token.ath)}
            fullValue={
              token.ath_date
                ? `${formatPercentage(token.ath_change_percentage)} from ATH · ${new Date(token.ath_date).toLocaleDateString()}`
                : undefined
            }
          />
          <StatItem
            label="ATL"
            value={formatPrice(token.atl)}
            fullValue={
              token.atl_date
                ? `${formatPercentage(token.atl_change_percentage)} from ATL · ${new Date(token.atl_date).toLocaleDateString()}`
                : undefined
            }
          />
        </div>

        {/* 7-day sparkline */}
        {token.sparkline_in_7d && token.sparkline_in_7d.price.length > 1 && (
          <div className="mb-6">
            <h3 className="text-gray-300 text-sm mb-2">7 Day Price</h3>
            <Sparkline data={token.sparkline_in_7d.price} />
          </div>
        )}

        {/* Cultural context — first step toward the MemePedia vision */}
        <AboutSection
          key={token.id}
          detail={detail}
          isLoading={detailLoading}
        />

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
        <p className="text-center text-gray-400 text-xs mt-4">
          Press ESC or tap outside to close
        </p>
      </div>
    </div>
  );
};

// "🚀 TO THE MOON" stamp + a single emoji confetti burst, shown once per
// modal open when the token is pumping >20% in 24h. Pure CSS, no re-renders.
const CONFETTI_EMOJI = ['🚀', '💎', '🔥', '📈', '🌕'];

const MoonCelebration = () => {
  const pieces = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        emoji: CONFETTI_EMOJI[i % CONFETTI_EMOJI.length],
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1 + Math.random() * 0.8,
        size: 14 + Math.random() * 12,
      })),
    []
  );

  return (
    <>
      {/* Stamp */}
      <div
        className="absolute top-14 right-6 z-10 px-3 py-1 border-4 border-neon-gold rounded-lg
          text-neon-gold font-bold text-lg tracking-wider whitespace-nowrap
          bg-cyber-bg/40 animate-stamp-in pointer-events-none select-none"
        aria-hidden="true"
      >
        🚀 TO THE MOON
      </div>

      {/* One-shot confetti */}
      <div
        className="absolute inset-x-0 top-0 h-0 pointer-events-none select-none"
        aria-hidden="true"
      >
        {pieces.map((p, i) => (
          <span
            key={i}
            className="absolute"
            style={{
              left: `${p.left}%`,
              fontSize: p.size,
              animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
              opacity: 0,
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>
    </>
  );
};

// About / community section fed by the extended /coins/{id} endpoint
const AboutSection = ({
  detail,
  isLoading,
}: {
  detail: ReturnType<typeof useTokenDetail>['data'];
  isLoading: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="mb-6 space-y-2" aria-label="Loading description">
        <div className="h-3 bg-cyber-secondary/70 rounded animate-pulse" />
        <div className="h-3 bg-cyber-secondary/70 rounded animate-pulse w-5/6" />
        <div className="h-3 bg-cyber-secondary/70 rounded animate-pulse w-2/3" />
      </div>
    );
  }
  if (!detail) return null;

  // CoinGecko descriptions embed raw HTML links — strip to plain text
  const description = (detail.description?.en ?? '').replace(/<[^>]*>/g, '').trim();
  const shortDescription =
    description.length > 320 && !expanded
      ? `${description.slice(0, 320).trimEnd()}…`
      : description;

  const links = detail.links;
  const homepage = links?.homepage?.find(Boolean);
  const twitter = links?.twitter_screen_name;
  const telegram = links?.telegram_channel_identifier;
  const subreddit = links?.subreddit_url;

  const community = detail.community_data;
  const communityStats = [
    { label: 'Twitter', value: community?.twitter_followers },
    { label: 'Reddit', value: community?.reddit_subscribers },
    { label: 'Telegram', value: community?.telegram_channel_user_count },
  ].filter((s) => s.value != null && s.value > 0);

  if (!description && !homepage && !twitter && communityStats.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-gray-300 text-sm mb-2">About</h3>

      {description && (
        <p className="text-gray-300 text-sm leading-relaxed mb-2">
          {shortDescription}
          {description.length > 320 && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="ml-1 text-neon-cyan text-xs hover:underline"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </p>
      )}

      {/* Social / official links */}
      {(homepage || twitter || telegram || subreddit) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {homepage && <LinkChip href={homepage} label="Website" />}
          {twitter && <LinkChip href={`https://x.com/${twitter}`} label="Twitter/X" />}
          {telegram && <LinkChip href={`https://t.me/${telegram}`} label="Telegram" />}
          {subreddit && <LinkChip href={subreddit} label="Reddit" />}
        </div>
      )}

      {/* Community size */}
      {communityStats.length > 0 && (
        <div className="flex gap-4">
          {communityStats.map((s) => (
            <div key={s.label}>
              <div className="text-gray-400 text-xs">{s.label}</div>
              <div className="text-white font-mono text-sm">
                {formatNumber(s.value as number)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const LinkChip = ({ href, label }: { href: string; label: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="px-2.5 py-1 bg-cyber-secondary/60 border border-neon-cyan/30 hover:border-neon-cyan/70 rounded-full text-xs text-neon-cyan transition-colors"
  >
    {label} ↗
  </a>
);

const StatItem = ({
  label,
  value,
  fullValue,
}: {
  label: string;
  value: string;
  fullValue?: string;
}) => (
  <div
    className="bg-cyber-secondary/50 rounded-lg p-3"
    title={fullValue}
  >
    <div className="text-gray-300 text-xs mb-1">{label}</div>
    <div className="text-white font-mono">{value}</div>
  </div>
);

// Sparkline with gradient fill, min/max labels and hover tooltip
const Sparkline = ({ data }: { data: number[] }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (!data || data.length < 2) return null;

  const W = 100;
  const H = 50;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const toPoint = (value: number, index: number) => ({
    x: (index / (data.length - 1)) * W,
    y: H - 4 - ((value - min) / range) * (H - 8),
  });

  const points = data.map((v, i) => {
    const { x, y } = toPoint(v, i);
    return `${x},${y}`;
  });

  const isPositive = data[data.length - 1] >= data[0];
  const color = isPositive ? '#00ff88' : '#ff4757';
  const gradientId = isPositive ? 'spark-up' : 'spark-down';

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = (e.clientX - rect.left) / rect.width;
    const index = Math.round(ratio * (data.length - 1));
    setHoverIndex(Math.max(0, Math.min(data.length - 1, index)));
  };

  const hoverPoint = hoverIndex != null ? toPoint(data[hoverIndex], hoverIndex) : null;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-20 cursor-crosshair"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
        role="img"
        aria-label={`7 day price chart, from ${formatPrice(data[0])} to ${formatPrice(data[data.length - 1])}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <polygon
          points={`0,${H} ${points.join(' ')} ${W},${H}`}
          fill={`url(#${gradientId})`}
        />

        {/* Line */}
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />

        {/* Hover crosshair + dot */}
        {hoverPoint && (
          <>
            <line
              x1={hoverPoint.x}
              y1={0}
              x2={hoverPoint.x}
              y2={H}
              stroke="#ffffff"
              strokeOpacity="0.3"
              strokeWidth="0.5"
            />
            <circle cx={hoverPoint.x} cy={hoverPoint.y} r="2" fill={color} />
          </>
        )}
      </svg>

      {/* Hover tooltip */}
      {hoverIndex != null && (
        <div
          className="absolute -top-7 px-2 py-0.5 bg-cyber-secondary border border-neon-cyan/40 rounded text-xs font-mono text-white pointer-events-none whitespace-nowrap"
          style={{
            left: `${(hoverIndex / (data.length - 1)) * 100}%`,
            transform: 'translateX(-50%)',
          }}
        >
          {formatPrice(data[hoverIndex])}
        </div>
      )}

      {/* Min / max labels */}
      <div className="flex justify-between text-xs text-gray-400 font-mono mt-1">
        <span>Low {formatPrice(min)}</span>
        <span>High {formatPrice(max)}</span>
      </div>
    </div>
  );
};
