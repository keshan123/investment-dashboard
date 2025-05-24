import { Component, Injectable } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel } from '@ionic/angular/standalone';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
export class PortfolioPage {
  investmentsWithPercent$: Observable<(Investment & { percent: number })[]>;

  constructor(private portfolioService: PortfolioService) {
    this.investmentsWithPercent$ = this.portfolioService.investments$.pipe(
      map(investments => {
        const total = investments.reduce((sum, inv) => sum + inv.quantity, 0);
        return investments.map(inv => ({
          ...inv,
          percent: total ? (inv.quantity / total) * 100 : 0
        }));
      })
    );
  }
}
