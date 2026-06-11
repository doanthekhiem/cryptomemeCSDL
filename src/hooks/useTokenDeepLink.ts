import { useEffect } from 'react';
import { useGalleryStore } from '../stores/galleryStore';

// Shareable URLs: #/token/<id> opens that token's detail panel on load and
// the hash tracks the currently selected token. Client-side only — groundwork
// for real /token/:id routes (SSR/NextJS) in the MemePedia phase.
const HASH_PREFIX = '#/token/';

const tokenIdFromHash = (): string | null =>
  window.location.hash.startsWith(HASH_PREFIX)
    ? decodeURIComponent(window.location.hash.slice(HASH_PREFIX.length))
    : null;

export const useTokenDeepLink = () => {
  // Open the token from the URL once data arrives
  useEffect(() => {
    const openFromHash = (tokens: ReturnType<typeof useGalleryStore.getState>['tokens']) => {
      const id = tokenIdFromHash();
      if (!id || tokens.length === 0) return;
      const token = tokens.find((t) => t.id === id);
      if (token) {
        const { teleportToToken, selectToken } = useGalleryStore.getState();
        teleportToToken(token.id);
        selectToken(token);
      }
    };

    openFromHash(useGalleryStore.getState().tokens);
    return useGalleryStore.subscribe((s) => s.tokens, openFromHash);
  }, []);

  // Reflect the selected token in the URL (replaceState — no history spam)
  useEffect(() => {
    return useGalleryStore.subscribe(
      (s) => s.selectedToken,
      (token) => {
        const url = token
          ? `${HASH_PREFIX}${encodeURIComponent(token.id)}`
          : window.location.pathname + window.location.search;
        window.history.replaceState(null, '', url);
      }
    );
  }, []);
};
