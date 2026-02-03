// Format price with appropriate decimals
export const formatPrice = (price: number | null | undefined): string => {
  if (price == null) return '$0.00';
  if (price >= 1) {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else if (price >= 0.0001) {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    });
  } else {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 8,
      maximumFractionDigits: 10,
    });
  }
};

// Format market cap
export const formatMarketCap = (marketCap: number | null | undefined): string => {
  if (marketCap == null) return '$0';
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(2)}T`;
  } else if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(2)}B`;
  } else if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(2)}M`;
  } else if (marketCap >= 1e3) {
    return `$${(marketCap / 1e3).toFixed(2)}K`;
  }
  return `$${marketCap.toFixed(2)}`;
};

// Format percentage change
export const formatPercentage = (percentage: number): string => {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(2)}%`;
};

// Format large numbers
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

// Get color based on price change
export const getPriceChangeColor = (change: number): string => {
  if (change > 10) return '#00ff88'; // Bright green for pump
  if (change > 0) return '#4ade80'; // Green
  if (change > -10) return '#f87171'; // Red
  return '#ff4757'; // Bright red for dump
};

// Check if token is pumping or dumping
export const getTokenStatus = (
  priceChange24h: number
): 'pump' | 'dump' | 'neutral' => {
  if (priceChange24h > 10) return 'pump';
  if (priceChange24h < -10) return 'dump';
  return 'neutral';
};
