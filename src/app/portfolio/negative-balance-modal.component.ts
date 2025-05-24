import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-negative-balance-modal',
  standalone: true,
  imports: [IonicModule],
  template: `
    <ion-content class="ion-padding negative-balance-modal-content" style="text-align: center;">
      <ion-header style="margin-bottom: 16px;">
        <ion-toolbar color="danger">
          <ion-title>Negative Balance</ion-title>
        </ion-toolbar>
      </ion-header>
      <h2 style="color: #DC1433;">Your cash balance is negative</h2>
      <p style="margin: 16px 0; color: #fff;">
        Please deposit funds or sell shares to make your balance positive again.
      </p>
      <div style="display: flex; justify-content: center; gap: 12px; margin-top: 24px;">
        <ion-button color="primary" (click)="goToDeposit()" style="padding: 0 12px; min-width: 80px; width: auto; align-self: center;">Deposit</ion-button>
        <ion-button color="medium" (click)="dismiss()" style="padding: 0 12px; min-width: 80px; width: auto; align-self: center;">Dismiss</ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .negative-balance-modal-content {
      background: #232323;
      height: 50vh;
      border-top-left-radius: 18px;
      border-top-right-radius: 18px;
      box-shadow: 0 -2px 16px 0 rgba(0,0,0,0.18);
      animation: slideUp 0.3s cubic-bezier(.36,1.01,.32,1) 1;
    }
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    h2 { font-weight: 700; }
  `]
})
export class NegativeBalanceModalComponent {
  constructor(private router: Router) {}

  dismiss() {
    const modal = document.querySelector('ion-modal');
    if (modal) (modal as any).dismiss();
  }

  goToDeposit() {
    const modal = document.querySelector('ion-modal');
    if (modal) (modal as any).dismiss();
    this.router.navigate(['/tabs/deposit']);
  }
} 