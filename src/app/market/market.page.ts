import { Component, Injectable, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel } from '@ionic/angular/standalone';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { RouterModule } from '@angular/router';
import { PriceFluctuationService, PriceTick } from '../price-fluctuation.service';

export interface Product {
  id: string;
  symbol: string;
  name: string;
  price: number;
}

@Injectable({ providedIn: 'root' })
export class MarketService {
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();

  constructor() {
    this.loadProducts();
  }

  private async loadProducts() {
    const [pricingResp, instrumentsResp] = await Promise.all([
      fetch('assets/pricing.json'),
      fetch('assets/instrument-list.json')
    ]);
    const pricing = await pricingResp.json();
    const instruments = await instrumentsResp.json();
    // Merge by symbol
    const products: Product[] = pricing.map((p: any) => {
      const instrument = instruments.find((i: any) => i.symbol === p.symbol);
      return instrument ? {
        id: p.id,
        symbol: p.symbol,
        name: instrument.name,
        price: p.price
      } : null;
    }).filter(Boolean);
    this.productsSubject.next(products);
  }
}

@Component({
  selector: 'app-market',
  templateUrl: 'market.page.html',
  styleUrls: ['market.page.scss'],
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
    IonLabel,
    RouterModule,
  ],
})
export class MarketPage implements OnInit {
  products$: Observable<Product[]>;
  livePrices: { [symbol: string]: PriceTick } = {};

  constructor(
    private marketService: MarketService,
    private priceFluctuation: PriceFluctuationService
  ) {
    this.products$ = this.marketService.products$;
  }

  async ngOnInit() {
    // Initialize price service with pricing.json
    const resp = await fetch('assets/pricing.json');
    const pricing = await resp.json();
    this.priceFluctuation.initPrices(pricing);
    // Subscribe to all price ticks for template use
    this.priceFluctuation.getAllPrices$().subscribe(prices => {
      this.livePrices = prices;
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
}
