import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    this.listenForKonamiCode();
  }

  listenForKonamiCode() {
    const konami = [
      'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
      'b', 'a'
    ];
    let buffer: string[] = [];
    window.addEventListener('keydown', (e) => {
      buffer.push(e.key);
      if (buffer.length > konami.length) buffer.shift();
      if (buffer.join(',') === konami.join(',')) {
        console.log('konami code detected');
        window.dispatchEvent(new CustomEvent('konami-mario'));
        buffer = [];
      }
    });
  }
}
