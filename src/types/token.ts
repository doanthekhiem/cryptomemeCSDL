// Meme Token data from CoinGecko API
export interface MemeToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number | null;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: null | {
    times: number;
    currency: string;
    percentage: number;
  };
  last_updated: string;
  sparkline_in_7d?: {
    price: number[];
  };
}

// Token position in 3D spiral
export interface TokenPosition {
  token: MemeToken;
  position: [number, number, number];
  rotation: [number, number, number];
  spiralIndex: number;
  wall: 'inner' | 'outer';
}

// Token detail (extended info)
export interface TokenDetail extends MemeToken {
  description?: { en: string };
  links?: {
    homepage: string[];
    blockchain_site: string[];
    official_forum_url: string[];
    chat_url: string[];
    announcement_url: string[];
    twitter_screen_name: string;
    telegram_channel_identifier: string;
    subreddit_url: string;
  };
  community_data?: {
    twitter_followers: number | null;
    reddit_subscribers: number | null;
    telegram_channel_user_count: number | null;
  };
}
