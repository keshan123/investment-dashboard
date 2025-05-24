import { Component, Injectable, OnInit } from '@angular/core';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { RouterModule } from '@angular/router';
import { PriceFluctuationService, PriceTick } from '../price-fluctuation.service';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

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
  public loading$ = new BehaviorSubject<boolean>(true);

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
    this.loading$.next(false);
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
    RouterModule,
    FormsModule,
    IonicModule,
  ],
  providers: [MarketService],
  animations: [
    trigger('listAnimation', [
      transition('* <=> *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(10px)' }),
            stagger('70ms', [
              animate('0.5s cubic-bezier(.35,0,.25,1)', style({ opacity: 1, transform: 'none' }))
            ])
          ],
          { optional: true }
        )
      ])
    ])
  ]
})
export class MarketPage implements OnInit {
  products$: Observable<Product[]>;
  filteredProducts$: Observable<Product[]>;
  searchTerm$: BehaviorSubject<string> = new BehaviorSubject('');
  _searchTerm: string = '';
  livePrices: { [symbol: string]: PriceTick } = {};
  public loading = true;

  get searchTerm() {
    return this._searchTerm;
  }
  set searchTerm(val: string) {
    this._searchTerm = val;
    this.searchTerm$.next(val);
  }

  constructor(
    private marketService: MarketService,
    private priceFluctuation: PriceFluctuationService
  ) {
    this.products$ = this.marketService.products$;
    this.filteredProducts$ = combineLatest([
      this.products$,
      this.searchTerm$
    ]).pipe(
      map(([products, searchTerm]) => {
        if (!searchTerm) return products;
        const term = searchTerm.toLowerCase();
        return products.filter(p =>
          p.name.toLowerCase().includes(term) ||
          p.symbol.toLowerCase().includes(term)
        );
      })
    );
    this.marketService.loading$.subscribe(loading => {
      this.loading = loading;
    });
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

  trackBySymbol(index: number, product: Product) {
    return product.symbol;
  }
}
