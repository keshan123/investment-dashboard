import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PortfolioService } from '../portfolio/portfolio.page';
import { ToastController } from '@ionic/angular/standalone';
import { PriceFluctuationService, PriceTick } from '../price-fluctuation.service';

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
export class ProductDetailPage implements OnInit {
  symbol = inject(ActivatedRoute).snapshot.paramMap.get('symbol');
  product: any = null;
  price: number | null = null;
  loading = true;
  quantity = 1;
  priceTick: PriceTick | null = null;
  private router = inject(Router);
  private toastController = inject(ToastController);
  private priceFluctuation = inject(PriceFluctuationService);

  constructor(private portfolioService: PortfolioService) {
    this.loadProduct();
  }

  async ngOnInit() {
    if (this.symbol) {
      this.priceFluctuation.getPrice$(this.symbol)?.subscribe(tick => {
        this.priceTick = tick;
        this.price = tick.price;
      });
    }
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
      this.portfolioService.addInvestment(this.product, this.quantity, this.price);
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
} 