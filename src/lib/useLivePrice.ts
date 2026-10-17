import { useEffect, useRef, useState } from 'react';

/**
 * Simulates a live ticking price around a base value.
 * Returns the current price and tick direction for flash colouring.
 */
export function useLivePrice(base: number) {
  const [price, setPrice] = useState(base);
  const [dir, setDir] = useState<1 | -1>(1);
  const prevRef = useRef(base);

  useEffect(() => {
    setPrice(base);
    prevRef.current = base;
  }, [base]);

  useEffect(() => {
    const id = setInterval(() => {
      setPrice((p) => p * (1 + (Math.random() - 0.48) * 0.0011));
    }, 1800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (price !== prevRef.current) {
      setDir(price > prevRef.current ? 1 : -1);
      prevRef.current = price;
    }
  }, [price]);

  return { price, dir };
}
