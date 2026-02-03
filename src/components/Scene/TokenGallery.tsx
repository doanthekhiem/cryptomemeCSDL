import { Suspense } from 'react';
import { TokenPosition } from '../../types';
import { TokenFrame } from './TokenFrame';
import { useGalleryStore } from '../../stores/galleryStore';

interface TokenGalleryProps {
  tokenPositions: TokenPosition[];
}

export const TokenGallery = ({ tokenPositions }: TokenGalleryProps) => {
  const nearestToken = useGalleryStore((s) => s.nearestToken);
  const selectToken = useGalleryStore((s) => s.selectToken);

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
    </group>
  );
};
