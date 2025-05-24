import { Injectable } from '@angular/core';
import { BehaviorSubject, interval } from 'rxjs';

export interface PriceTick {
  symbol: string;
  price: number;
  prevPrice: number;
  history: number[];
}

@Injectable({ providedIn: 'root' })
export class PriceFluctuationService {
  private prices: { [symbol: string]: PriceTick } = {};
  private priceSubjects: { [symbol: string]: BehaviorSubject<PriceTick> } = {};
  private initialized = false;
  private allPricesSubject = new BehaviorSubject<{ [symbol: string]: PriceTick }>({});
  public priceUpdatesEnabled = false;

  constructor() {
    interval(1000).subscribe(() => this.updatePrices());
  }

  setPriceUpdatesEnabled(enabled: boolean) {
    this.priceUpdatesEnabled = enabled;
  }

  // Call this once with the initial price list
  initPrices(initialPrices: { symbol: string; price: number }[]) {
    if (this.initialized) return;
    for (const { symbol, price } of initialPrices) {
      this.prices[symbol] = {
        symbol,
        price,
        prevPrice: price,
        history: Array(30).fill(price),
      };
      this.priceSubjects[symbol] = new BehaviorSubject(this.prices[symbol]);
    }
    this.initialized = true;
    this.allPricesSubject.next({ ...this.prices });
  }

  getPrice$(symbol: string) {
    return this.priceSubjects[symbol]?.asObservable();
  }

  getAllPrices$() {
    return this.allPricesSubject.asObservable();
  }

  private updatePrices() {
    if (!this.priceUpdatesEnabled) return;
    for (const symbol in this.prices) {
      const tick = this.prices[symbol];
      tick.prevPrice = tick.price;
      // Simulate a realistic price change (±1%)
      const change = tick.price * (Math.random() - 0.5) * 0.02;
      tick.price = Math.max(0.01, +(tick.price + change).toFixed(2));
      tick.history.push(tick.price);
      if (tick.history.length > 30) tick.history.shift();
      this.priceSubjects[symbol].next({ ...tick });
    }
    this.allPricesSubject.next({ ...this.prices });
  }
} 