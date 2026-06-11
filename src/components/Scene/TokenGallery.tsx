import { Suspense, useMemo } from 'react';
import { Text } from '@react-three/drei';
import { TokenPosition } from '../../types';
import { TokenFrame } from './TokenFrame';
import { COLORS } from '../../utils/constants';
import { useGalleryStore } from '../../stores/galleryStore';

interface TokenGalleryProps {
  tokenPositions: TokenPosition[];
}

// Neon district signs above the most extreme movers of the day
const ZoneSign = ({
  tp,
  text,
  color,
}: {
  tp: TokenPosition;
  text: string;
  color: string;
}) => (
  <Text
    position={[tp.position[0], tp.position[1] + 3.1, tp.position[2]]}
    rotation={tp.rotation}
    fontSize={0.55}
    color={color}
    anchorX="center"
    anchorY="middle"
    outlineWidth={0.03}
    outlineColor="#000000"
  >
    {text}
  </Text>
);

export const TokenGallery = ({ tokenPositions }: TokenGalleryProps) => {
  const nearestToken = useGalleryStore((s) => s.nearestToken);
  const selectToken = useGalleryStore((s) => s.selectToken);

  // Biggest pump / dump of the day get their own neon district sign
  const { pumpZone, rektAlley } = useMemo(() => {
    let pumpZone: TokenPosition | null = null;
    let rektAlley: TokenPosition | null = null;
    let maxChange = 10; // signs only appear past the ±10% threshold
    let minChange = -10;

    for (const tp of tokenPositions) {
      const change = tp.token.price_change_percentage_24h ?? 0;
      if (change > maxChange) {
        maxChange = change;
        pumpZone = tp;
      }
      if (change < minChange) {
        minChange = change;
        rektAlley = tp;
      }
    }
    return { pumpZone, rektAlley };
  }, [tokenPositions]);

  return (
    <group name="token-gallery">
      {tokenPositions.map((tp) => (
        <Suspense key={tp.token.id} fallback={null}>
          <TokenFrame
            tokenPosition={tp}
            isNearest={nearestToken?.token.id === tp.token.id}
            onClick={() => selectToken(tp.token)}
          />
        </Suspense>
      ))}

      {pumpZone && (
        <ZoneSign tp={pumpZone} text="PUMP ZONE" color={COLORS.pumpGreen} />
      )}
      {rektAlley && (
        <ZoneSign tp={rektAlley} text="REKT ALLEY" color={COLORS.dumpRed} />
      )}
    </group>
  );
};
