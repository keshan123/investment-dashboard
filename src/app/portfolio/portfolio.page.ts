import { Component, Injectable, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonIcon, IonButton, IonButtons } from '@ionic/angular/standalone';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { PriceFluctuationService, PriceTick } from '../price-fluctuation.service';
import { ToastController } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { NegativeBalanceModalComponent } from './negative-balance-modal.component';
import { Router } from '@angular/router';

export interface Investment {
  id: string;
  symbol: string;
  name: string;
  category: string;
  quantity: number;
  avgBuyPrice: number;
}

/**
 * Investment with calculated portfolio metrics.
 */
type InvestmentWithMetrics = Investment & {
  percent: number;
  totalValue: number;
  initialValue: number;
  percentDiff: number;
};

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private readonly investmentsSubject = new BehaviorSubject<Investment[]>([]);
  /** Observable stream of current investments. */
  readonly investments$ = this.investmentsSubject.asObservable();

  private readonly cashBalanceSubject = new BehaviorSubject<number>(
    Number(localStorage.getItem('cashBalance')) || 0
  );
  /** Observable stream of cash balance. */
  readonly cashBalance$ = this.cashBalanceSubject.asObservable();

  constructor() {
    this.loadInvestments();
  }

  /**
   * Loads the user's investments from the portfolio.json file.
   */
  private async loadInvestments(): Promise<void> {
    const resp = await fetch('assets/portfolio.json');
    const data = await resp.json();
    this.investmentsSubject.next(data);
  }

  /**
   * Adds or updates an investment in the portfolio.
   * @param product The investment product.
   * @param quantity Number of shares to add.
   * @param price Price per share at purchase.
   */
  addOrUpdateInvestment(product: any, quantity: number, price: number): void {
    const current = [...this.investmentsSubject.value];
    const idx = current.findIndex(inv => inv.symbol === product.symbol);
    if (idx > -1) {
      // Update existing investment
      const oldQty = current[idx].quantity;
      const newQty = oldQty + quantity;
      current[idx] = {
        ...current[idx],
        quantity: newQty,
        avgBuyPrice: ((current[idx].avgBuyPrice * oldQty) + (price * quantity)) / newQty
      };
    } else {
      // Add new investment
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
    // Subtract cost from cash balance (allow negative)
    const cost = quantity * price;
    const newCash = (this.cashBalanceSubject.value || 0) - cost;
    this.setCashBalance(newCash);
  }

  /** Returns the cash balance observable. */
  getCashBalance$(): Observable<number> {
    return this.cashBalance$;
  }

  /** Sets the cash balance and persists it. */
  setCashBalance(amount: number): void {
    this.cashBalanceSubject.next(amount);
    localStorage.setItem('cashBalance', String(amount));
  }

  /**
   * Sells a quantity of an investment, updates portfolio and cash balance.
   * @param symbol The symbol of the investment to sell.
   * @param quantity Number of shares to sell.
   * @param price Price per share at sale.
   */
  sellInvestment(symbol: string, quantity: number, price: number): void {
    const current = [...this.investmentsSubject.value];
    const idx = current.findIndex(inv => inv.symbol === symbol);
    if (idx > -1) {
      const inv = current[idx];
      if (inv.quantity < quantity) {
        // Not enough shares to sell
        return;
      }
      const newQty = inv.quantity - quantity;
      if (newQty > 0) {
        current[idx] = { ...inv, quantity: newQty };
      } else {
        current.splice(idx, 1);
      }
      this.investmentsSubject.next(current);
      // Add proceeds to cash balance
      const proceeds = quantity * price;
      const newCash = (this.cashBalanceSubject.value || 0) + proceeds;
      this.setCashBalance(newCash);
    }
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
    IonLabel,
    IonIcon,
    IonButton,
    IonButtons
  ],
  providers: [ModalController],
})
export class PortfolioPage implements OnInit {
  /** Observable of investments with calculated metrics. */
  readonly investmentsWithMetrics$: Observable<InvestmentWithMetrics[]>;

  /** Latest live prices keyed by symbol. */
  private livePrices: { [symbol: string]: PriceTick } = {};
  private readonly livePricesSubject = new BehaviorSubject<{ [symbol: string]: PriceTick }>({});

  readonly donutColors = [
    '#4F8EF7', // blue
    '#34C759', // green
    '#FF9500', // orange
    '#FF2D55', // red
    '#AF52DE', // purple
    '#FFD60A', // yellow
    '#5AC8FA', // light blue
    '#5856D6', // indigo
  ];

  /** Observable of cash balance for display in the template. */
  public readonly cashBalance$ = this.portfolioService.cashBalance$;

  private lastNegativeModalShown = false;

  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly priceFluctuation: PriceFluctuationService,
    private modalController: ModalController,
    private router: Router
  ) {
    // Combine investments and live prices to calculate metrics for display
    this.investmentsWithMetrics$ = combineLatest([
      this.portfolioService.investments$,
      this.livePricesSubject.asObservable()
    ]).pipe(
      map(([investments, livePrices]) => this.calculateInvestmentMetrics(investments, livePrices))
    );

    // Subscribe to cash balance and show modal if negative
    this.portfolioService.cashBalance$.subscribe(async cash => {
      if (cash < 0 && !this.lastNegativeModalShown) {
        this.lastNegativeModalShown = true;
        const modal = await this.modalController.create({
          component: NegativeBalanceModalComponent,
          cssClass: 'negative-balance-modal',
          backdropDismiss: true,
          breakpoints: [0, 0.5, 1],
          initialBreakpoint: 0.5
        });
        modal.onDidDismiss().then(() => {
          // Modal dismissed, but only show again if balance goes positive and negative again
        });
        await modal.present();
      } else if (cash >= 0) {
        this.lastNegativeModalShown = false;
      }
    });
  }

  async ngOnInit(): Promise<void> {
    // Ensure price service is initialized (for direct navigation/refresh)
    if (!(this.priceFluctuation as any).initialized) {
      const resp = await fetch('assets/pricing.json');
      const pricing = await resp.json();
      this.priceFluctuation.initPrices(pricing);
    }
    // Subscribe to live price updates
    this.priceFluctuation.getAllPrices$().subscribe(prices => {
      this.livePrices = prices;
      this.livePricesSubject.next(prices);
    });
  }

  /**
   * Calculates portfolio metrics for each investment.
   */
  private calculateInvestmentMetrics(
    investments: Investment[],
    livePrices: { [symbol: string]: PriceTick }
  ): InvestmentWithMetrics[] {
    const totalQuantity = investments.reduce((sum, inv) => sum + inv.quantity, 0);
    return investments.map(inv => {
      const livePrice = livePrices[inv.symbol]?.price ?? inv.avgBuyPrice;
      const totalValue = inv.quantity * livePrice;
      const initialValue = inv.quantity * inv.avgBuyPrice;
      const percentDiff = initialValue === 0 ? 0 : ((totalValue - initialValue) / initialValue) * 100;
      return {
        ...inv,
        percent: totalQuantity ? (inv.quantity / totalQuantity) * 100 : 0,
        totalValue,
        initialValue,
        percentDiff
      };
    });
  }

  /**
   * Returns the latest price tick for a symbol.
   */
  getPriceTick(symbol: string): PriceTick | undefined {
    return this.livePrices[symbol];
  }

  /**
   * Returns a color string based on price movement for a symbol.
   */
  getPriceChangeColor(symbol: string): string {
    const tick = this.getPriceTick(symbol);
    if (!tick) return '';
    if (tick.price > tick.prevPrice) return 'green';
    if (tick.price < tick.prevPrice) return 'red';
    return '';
  }

  // --- Donut Chart Helpers ---

  /**
   * Returns the SVG stroke-dasharray for a donut chart segment.
   */
  getDonutDash(percent: number, radius: number): string {
    const circumference = 2 * Math.PI * radius;
    const length = circumference * (percent / 100);
    return `${length} ${circumference - length}`;
  }

  /**
   * Returns the SVG stroke-dashoffset for a donut chart segment.
   */
  getDonutOffset(index: number, investments: InvestmentWithMetrics[], radius: number): number {
    const circumference = 2 * Math.PI * radius;
    let offsetPercent = 0;
    for (let j = 0; j < index; j++) {
      offsetPercent += investments[j].percent;
    }
    return circumference * (1 - offsetPercent / 100);
  }

  /**
   * Returns the total value of all investments.
   */
  getTotalPortfolioValue(investments: InvestmentWithMetrics[]): number {
    return investments.reduce((sum, inv) => sum + inv.totalValue, 0);
  }

  /**
   * trackBy function for ngFor to optimize DOM updates.
   */
  trackBySymbol(index: number, inv: InvestmentWithMetrics): string {
    return inv.symbol;
  }

  goToDeposit() {
    this.router.navigate(['/tabs/deposit']);
  }
}
