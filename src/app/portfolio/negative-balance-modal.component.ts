import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-negative-balance-modal',
  standalone: true,
  imports: [IonicModule],
  template: `
    <ion-content class="ion-padding negative-balance-modal-content" style="text-align: center;">
      <ion-header>
        <ion-toolbar color="danger">
          <ion-title>Negative Balance</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-icon name="alert-circle" color="danger" style="font-size: 3em; margin-bottom: 16px;"></ion-icon>
      <h2 style="color: #DC1433;">Your cash balance is negative</h2>
      <p style="margin: 16px 0; color: #fff;">
        Please deposit funds or sell shares to make your balance positive again.
      </p>
      <ion-button color="medium" (click)="dismiss()" style="padding: 0 12px; min-width: 80px; width: auto; align-self: center;">Dismiss</ion-button>
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
  dismiss() {
    const modal = document.querySelector('ion-modal');
    if (modal) (modal as any).dismiss();
  }
} 