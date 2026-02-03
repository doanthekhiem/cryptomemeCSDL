import { MemeToken, TokenDetail } from '../types';
import { API_CONFIG } from '../utils/constants';

const { baseUrl } = API_CONFIG;

// Fetch meme tokens list sorted by market cap
export const fetchMemeTokens = async (
  page: number = 1,
  perPage: number = 100
): Promise<MemeToken[]> => {
  const url = new URL(`${baseUrl}/coins/markets`);
  url.searchParams.set('vs_currency', 'usd');
  url.searchParams.set('category', 'meme-token');
  url.searchParams.set('order', 'market_cap_desc');
  url.searchParams.set('per_page', perPage.toString());
  url.searchParams.set('page', page.toString());
  url.searchParams.set('sparkline', 'true');
  url.searchParams.set('price_change_percentage', '24h');

  const response = await fetch(url.toString());

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment.');
    }
    throw new Error(`Failed to fetch meme tokens: ${response.status}`);
  }

  return response.json();
};

// Fetch detailed info for a single token
export const fetchTokenDetail = async (id: string): Promise<TokenDetail> => {
  const url = new URL(`${baseUrl}/coins/${id}`);
  url.searchParams.set('localization', 'false');
  url.searchParams.set('tickers', 'false');
  url.searchParams.set('market_data', 'true');
  url.searchParams.set('community_data', 'true');
  url.searchParams.set('developer_data', 'false');
  url.searchParams.set('sparkline', 'true');

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to fetch token detail: ${response.status}`);
  }

  return response.json();
};

// Search tokens by query
export const searchTokens = async (query: string): Promise<MemeToken[]> => {
  const url = new URL(`${baseUrl}/search`);
  url.searchParams.set('query', query);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  const data = await response.json();
  return data.coins || [];
};
