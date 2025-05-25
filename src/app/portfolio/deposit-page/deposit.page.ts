import { Component } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioService } from '../portfolio.page';
import { Router } from '@angular/router';
import { KonamiMarioService } from '../../konami-mario.service';

@Component({
  selector: 'app-deposit',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './deposit.page.html'
})
export class DepositPage {
  cashBalance = 0;
  depositAmount: number | null = 50;

  constructor(
    private portfolioService: PortfolioService,
    private toastController: ToastController,
    private router: Router,
    private konamiMario: KonamiMarioService
  ) {
    this.portfolioService.cashBalance$.subscribe(cash => {
      this.cashBalance = cash;
    });
  }

  async deposit() {
    if (this.depositAmount && this.depositAmount > 0) {
      const newBalance = (this.cashBalance || 0) + this.depositAmount;
      this.portfolioService.setCashBalance(newBalance);
      if (this.konamiMario.isKonamiActive()) {
        const coin = new Audio('assets/smb_coin.wav');
        coin.currentTime = 0;
        coin.play();
      }
      const toast = await this.toastController.create({
        message: `Deposited $${this.depositAmount.toFixed(2)}!`,
        duration: 1500,
        color: 'success',
        position: 'bottom',
      });
      await toast.present();
      this.depositAmount = null;
      this.router.navigate(['/tabs/portfolio']);
    }
  }
} 