import { Component, Injectable, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel } from '@ionic/angular/standalone';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { PriceFluctuationService, PriceTick } from '../price-fluctuation.service';

export interface Investment {
  id: string;
  symbol: string;
  name: string;
  category: string;
  quantity: number;
  avgBuyPrice: number;
}

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private investmentsSubject = new BehaviorSubject<Investment[]>([]);
  public investments$ = this.investmentsSubject.asObservable();

  constructor() {
    this.loadInvestments();
  }

  private async loadInvestments() {
    const resp = await fetch('assets/portfolio.json');
    const data = await resp.json();
    this.investmentsSubject.next(data);
  }

  addInvestment(product: any, quantity: number, price: number) {
    const current = this.investmentsSubject.value.slice();
    const idx = current.findIndex(inv => inv.symbol === product.symbol);
    if (idx > -1) {
      const oldQty = current[idx].quantity;
      const newQty = oldQty + quantity;
      current[idx] = {
        ...current[idx],
        quantity: newQty,
        avgBuyPrice: ((current[idx].avgBuyPrice * oldQty) + (price * quantity)) / newQty
      };
    } else {
      current.push({
        id: product.id,
        symbol: product.symbol,
        name: product.name,
        category: product.category,
        quantity,
        avgBuyPrice: price
      });
    }
    this.investmentsSubject.next(current);
  }
}

@Component({
  selector: 'app-portfolio',
  templateUrl: 'portfolio.page.html',
  styleUrls: ['portfolio.page.scss'],
  imports: [
    CommonModule,
    NgIf,
    NgFor,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel
  ],
})
export class PortfolioPage implements OnInit {
  investmentsWithPercent$: Observable<(
    Investment & {
      percent: number;
      totalValue: number;
      initialValue: number;
      percentDiff: number;
    }
  )[]>;
  livePrices: { [symbol: string]: PriceTick } = {};
  private livePricesSubject = new BehaviorSubject<{ [symbol: string]: PriceTick }>({});
  donutColors = [
    '#4F8EF7', // blue
    '#34C759', // green
    '#FF9500', // orange
    '#FF2D55', // red
    '#AF52DE', // purple
    '#FFD60A', // yellow
    '#5AC8FA', // light blue
    '#5856D6', // indigo
  ];

  constructor(
    private portfolioService: PortfolioService,
    private priceFluctuation: PriceFluctuationService
  ) {
    this.investmentsWithPercent$ = combineLatest([
      this.portfolioService.investments$,
      this.livePricesSubject.asObservable()
    ]).pipe(
      map(([investments, livePrices]) => {
        const total = investments.reduce((sum, inv) => sum + inv.quantity, 0);
        return investments.map(inv => {
          const livePrice = livePrices[inv.symbol]?.price ?? inv.avgBuyPrice;
          const totalValue = inv.quantity * livePrice;
          const initialValue = inv.quantity * inv.avgBuyPrice;
          const percentDiff = initialValue === 0 ? 0 : ((totalValue - initialValue) / initialValue) * 100;
          return {
            ...inv,
            percent: total ? (inv.quantity / total) * 100 : 0,
            totalValue,
            initialValue,
            percentDiff
          };
        });
      })
    );
  }

  async ngOnInit() {
    // Ensure price service is initialized
    if (!(this.priceFluctuation as any).initialized) {
      const resp = await fetch('assets/pricing.json');
      const pricing = await resp.json();
      this.priceFluctuation.initPrices(pricing);
    }
    this.priceFluctuation.getAllPrices$().subscribe(prices => {
      this.livePrices = prices;
      this.livePricesSubject.next(prices);
    });
  }

  getPriceTick(symbol: string): PriceTick | undefined {
    return this.livePrices[symbol];
  }

  getPriceColor(symbol: string): string {
    const tick = this.getPriceTick(symbol);
    if (!tick) return '';
    if (tick.price > tick.prevPrice) return 'green';
    if (tick.price < tick.prevPrice) return 'red';
    return '';
  }

  getDonutDash(percent: number, r: number): string {
    const circ = 2 * Math.PI * r;
    const len = circ * (percent / 100);
    return `${len} ${circ - len}`;
  }

  getDonutOffset(i: number, investments: any[], r: number): number {
    // Offset is the sum of previous percents
    const circ = 2 * Math.PI * r;
    let offsetPercent = 0;
    for (let j = 0; j < i; j++) {
      offsetPercent += investments[j].percent;
    }
    return circ * (1 - offsetPercent / 100);
  }

  getTotalValue(investments: any[]): number {
    return investments.reduce((sum, inv) => sum + inv.totalValue, 0);
  }
}
