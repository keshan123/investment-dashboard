import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { PortfolioService } from '../portfolio/portfolio.page';
import { ToastController } from '@ionic/angular/standalone';
import { PriceFluctuationService, PriceTick } from '../price-fluctuation.service';
import { Subscription } from 'rxjs';
import { KonamiMarioService } from '../konami-mario.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: 'product-detail.page.html',
  styleUrls: ['product-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
  ],
})
export class ProductDetailPage implements OnInit, OnDestroy {
  symbol = inject(ActivatedRoute).snapshot.paramMap.get('symbol');
  product: any = null;
  price: number | null = null;
  loading = true;
  quantity = 1;
  priceTick: PriceTick | null = null;
  private router = inject(Router);
  private toastController = inject(ToastController);
  private priceFluctuation = inject(PriceFluctuationService);
  public konamiMario = inject(KonamiMarioService);
  private lastPrice: number | null = null;
  private isActiveRoute = true;
  private routerEventsSub: Subscription | null = null;
  private priceTickSub: Subscription | null = null;

  constructor(private portfolioService: PortfolioService) {
    this.loadProduct();
    // Listen to router events to check if this page is active
    const router = (this as any).router || null;
    if (router) {
      this.routerEventsSub = router.events.subscribe((event: any) => {
        if (event instanceof NavigationEnd) {
          const url = router.url;
          this.isActiveRoute = url.includes('/market/') && url.endsWith(this.symbol || '');
        }
      });
    }
    // Listen for route changes
    const activatedRoute = (this as any).activatedRoute || null;
    if (activatedRoute && activatedRoute.paramMap) {
      activatedRoute.paramMap.subscribe((params: any) => {
        const newSymbol = params.get('symbol');
        if (newSymbol && newSymbol !== this.symbol) {
          this.symbol = newSymbol;
          this.onSymbolChange();
        }
      });
    }
  }

  async ngOnInit() {
    // Ensure price service is initialized
    if (!(this.priceFluctuation as any).initialized) {
      const resp = await fetch('assets/pricing.json');
      const pricing = await resp.json();
      this.priceFluctuation.initPrices(pricing);
    }
    this.subscribeToPriceTick();
  }

  private subscribeToPriceTick() {
    if (this.priceTickSub) this.priceTickSub.unsubscribe();
    if (this.symbol) {
      this.priceTickSub = this.priceFluctuation.getPrice$(this.symbol)?.subscribe(tick => {
        this.priceTick = tick;
        this.price = tick.price;
        // Play sound on price up/down only if konamiActive and this chart is active
        if (this.konamiMario.isKonamiActive() && this.isActiveRoute && this.lastPrice !== null) {
          if (tick.price > this.lastPrice) {
            this.konamiMario.playJumpSmall();
          } else if (tick.price < this.lastPrice) {
            this.konamiMario.playJumpSuper();
          }
        }
        this.lastPrice = tick.price;
      }) || null;
    }
  }

  private async onSymbolChange() {
    this.lastPrice = null;
    this.priceTick = null;
    this.price = null;
    this.loading = true;
    await this.loadProduct();
    this.subscribeToPriceTick();
  }

  async loadProduct() {
    const [instrumentsResp, pricingResp] = await Promise.all([
      fetch('assets/instrument-list.json'),
      fetch('assets/pricing.json')
    ]);
    const instruments = await instrumentsResp.json();
    const pricing = await pricingResp.json();
    this.product = instruments.find((i: any) => i.symbol === this.symbol);
    const priceObj = pricing.find((p: any) => p.symbol === this.symbol);
    this.price = priceObj ? priceObj.price : null;
    this.loading = false;
  }

  get validQuantity(): number {
    const qty = Number(this.quantity);
    return isNaN(qty) || qty < 1 ? 1 : Math.floor(qty);
  }

  onQuantityChange(val: any) {
    const num = Number(val);
    this.quantity = isNaN(num) || num < 1 ? 1 : Math.floor(num);
    console.log('onQuantityChange:', val, 'parsed:', this.quantity);
  }

  getPriceColor(): string {
    if (!this.priceTick) return '';
    if (this.priceTick.price > this.priceTick.prevPrice) return 'green';
    if (this.priceTick.price < this.priceTick.prevPrice) return 'red';
    return '';
  }

  get priceHistory(): number[] {
    return this.priceTick?.history || [];
  }

  async buy() {
    console.log('buy() quantity:', this.quantity);
    if (this.product && this.price != null) {
      this.portfolioService.addOrUpdateInvestment(this.product, this.quantity, this.price);
      if (this.konamiMario.isKonamiActive()) {
        this.konamiMario.playPowerupSound();
      }
      const toast = await this.toastController.create({
        message: 'Investment added to your portfolio!',
        duration: 1500,
        color: 'success',
        position: 'bottom',
      });
      await toast.present();
    }
    this.router.navigate(['/tabs/portfolio']);
  }

  getLineGraphPoints(history: number[], width: number, height: number): string {
    if (!history.length) return '';
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;
    const n = history.length;
    return history.map((v, i) => {
      const x = (i / (n - 1)) * (width - 8) + 4; // 4px padding left/right
      const y = height - 4 - ((v - min) / range) * (height - 8); // 4px padding top/bottom
      return `${x},${y}`;
    }).join(' ');
  }

  getCurrentX(history: number[], width: number): number {
    if (!history.length) return 0;
    const n = history.length;
    return ((n - 1) / (n - 1)) * (width - 8) + 4;
  }

  getCurrentY(history: number[], height: number): number {
    if (!history.length) return 0;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;
    const v = history[history.length - 1];
    return height - 4 - ((v - min) / range) * (height - 8);
  }

  ngOnDestroy() {
    if (this.routerEventsSub) {
      this.routerEventsSub.unsubscribe();
    }
    if (this.priceTickSub) {
      this.priceTickSub.unsubscribe();
    }
  }
} 