import { useMemo } from 'react';
import { useGalleryStore } from '../../stores/galleryStore';
import { SPIRAL_CONFIG, COLORS } from '../../utils/constants';
import { getTokenStatus } from '../../utils/formatters';

// The 3D world is a helix (constant radius, increasing height), which is
// unreadable from a top-down view. The minimap "unrolls" height into radius:
// an archimedean spiral where the center = bottom turn, the edge = top turn.
const VIEW = 200;
const CENTER = VIEW / 2;
const R_MIN = 20;
const R_MAX = 92;
const MAX_ANGLE = SPIRAL_CONFIG.totalTurns * Math.PI * 2;

const mapPoint = (totalAngle: number, wallOffset = 0) => {
  const r = R_MIN + (totalAngle / MAX_ANGLE) * (R_MAX - R_MIN) + wallOffset;
  return {
    x: CENTER + r * Math.cos(totalAngle),
    y: CENTER + r * Math.sin(totalAngle),
  };
};

// Total spiral angle of token #index — mirrors calculateTokenPositions()
const tokenTotalAngle = (index: number) => {
  const { tokensPerTurn } = SPIRAL_CONFIG;
  const tokensPerWall = tokensPerTurn / 2;
  const turnIndex = Math.floor(index / tokensPerTurn);
  const wallPosition = (index % tokensPerTurn) % tokensPerWall;
  return turnIndex * Math.PI * 2 + ((wallPosition + 0.5) / tokensPerWall) * Math.PI * 2;
};

const TokenDots = () => {
  const tokenPositions = useGalleryStore((s) => s.tokenPositions);
  const nearestToken = useGalleryStore((s) => s.nearestToken);
  const teleportToToken = useGalleryStore((s) => s.teleportToToken);

  const dots = useMemo(
    () =>
      tokenPositions.map((tp) => {
        const angle = tokenTotalAngle(tp.spiralIndex);
        const { x, y } = mapPoint(angle, tp.wall === 'inner' ? -5 : 5);
        const status = getTokenStatus(tp.token.price_change_percentage_24h ?? 0);
        const color =
          status === 'pump'
            ? COLORS.pumpGreen
            : status === 'dump'
              ? COLORS.dumpRed
              : '#5a6a8a';
        return { id: tp.token.id, symbol: tp.token.symbol, x, y, color };
      }),
    [tokenPositions]
  );

  return (
    <>
      {dots.map((dot) => (
        <circle
          key={dot.id}
          cx={dot.x}
          cy={dot.y}
          r={nearestToken?.token.id === dot.id ? 4.5 : 3}
          fill={nearestToken?.token.id === dot.id ? COLORS.neonCyan : dot.color}
          className="cursor-pointer"
          onClick={() => teleportToToken(dot.id)}
        >
          <title>{dot.symbol.toUpperCase()} — click to travel here</title>
        </circle>
      ))}
    </>
  );
};

// Separate component so per-frame position updates don't re-render the dots
const PlayerDot = () => {
  const characterPosition = useGalleryStore((s) => s.characterPosition);

  const totalAngle = Math.max(
    0,
    Math.min(
      MAX_ANGLE,
      (characterPosition.y / SPIRAL_CONFIG.heightPerTurn) * Math.PI * 2
    )
  );
  const { x, y } = mapPoint(totalAngle);

  return (
    <g>
      <circle cx={x} cy={y} r="7" fill={COLORS.neonMagenta} opacity="0.25">
        <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={x} cy={y} r="4" fill={COLORS.neonMagenta} stroke="#fff" strokeWidth="1" />
    </g>
  );
};

export const Minimap = () => {
  const showMinimap = useGalleryStore((s) => s.showMinimap);
  const isLoading = useGalleryStore((s) => s.isLoading);
  const tokensCount = useGalleryStore((s) => s.tokens.length);

  const spiralPath = useMemo(() => {
    const pts: string[] = [];
    const steps = SPIRAL_CONFIG.totalTurns * 36;
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * MAX_ANGLE;
      const { x, y } = mapPoint(angle);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  }, []);

  if (!showMinimap || isLoading || tokensCount === 0) return null;

  return (
    <div
      className="fixed top-16 right-4 z-30 bg-cyber-primary/70 backdrop-blur-sm border border-neon-cyan/30 rounded-xl p-1.5 w-28 sm:w-40"
      aria-label="Minimap — click a dot to travel to that token"
    >
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="w-full h-auto">
        {/* Spiral track */}
        <polyline
          points={spiralPath}
          fill="none"
          stroke={COLORS.neonCyan}
          strokeOpacity="0.25"
          strokeWidth="1.5"
        />
        <TokenDots />
        <PlayerDot />
      </svg>
      <p className="text-center text-[10px] text-gray-400 leading-tight pb-0.5">
        center = bottom · <span className="text-neon-magenta">●</span> you
      </p>
    </div>
  );
};
