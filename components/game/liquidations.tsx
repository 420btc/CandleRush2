import { useAllLiquidations } from './exchanges';

export function useLiquidations({ 
  symbol = 'BTCUSDT', 
  minSize = 0, 
  maxSize = Infinity, 
  limit = 99, 
  smallLimit = 5 
} = {}) {
  return useAllLiquidations({ 
    symbol, 
    minSize, 
    maxSize, 
    limit, 
    smallLimit 
  });
}

