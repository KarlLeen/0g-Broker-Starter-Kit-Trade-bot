// 币安 API 工具函数

export interface BinanceTicker {
  symbol: string;
  price: string;
}

/**
 * 获取币安期货价格数据
 * @param symbol 交易对符号，如 'BTCUSDT'，如果不提供则获取所有交易对
 * @returns 价格数据数组
 */
export async function getBinancePrices(symbol?: string): Promise<BinanceTicker[]> {
  try {
    const url = symbol 
      ? `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`
      : 'https://fapi.binance.com/fapi/v1/ticker/price';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`币安 API 请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 如果指定了 symbol，返回单个对象数组；否则返回数组
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error('获取币安价格失败:', error);
    throw error;
  }
}

/**
 * 获取热门交易对的价格（BTC, ETH, BNB 等）
 */
export async function getPopularPrices(): Promise<BinanceTicker[]> {
  const popularSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'DOTUSDT'];
  
  try {
    const prices = await Promise.all(
      popularSymbols.map(symbol => getBinancePrices(symbol))
    );
    
    return prices.flat();
  } catch (error) {
    console.error('获取热门价格失败:', error);
    return [];
  }
}

/**
 * 格式化价格数据为 AI 可读的文本
 */
export function formatPricesForAI(prices: BinanceTicker[]): string {
  if (prices.length === 0) {
    return '暂无价格数据';
  }
  
  const formatted = prices
    .slice(0, 20) // 限制前20个
    .map(ticker => `${ticker.symbol}: $${parseFloat(ticker.price).toFixed(2)}`)
    .join('\n');
  
  return `当前币安期货价格数据（更新时间: ${new Date().toLocaleString('zh-CN')}）:\n${formatted}`;
}

