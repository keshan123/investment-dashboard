import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class KonamiMarioService {
  private konamiActive = false;
  private lineColors = ['#4F8EF7']; // default blue
  private powerup = new Audio('assets/smb_powerup.wav');
  private jumpSmall = new Audio('assets/smb_jump-small.wav');
  private jumpSuper = new Audio('assets/smb_jump-super.wav');
  private static konamiEventListenerAdded = false;

  constructor() {
    this.restoreKonamiState();
    this.addKonamiEventListener();
    // Ensure audio objects are initialized
    this.powerup = new Audio('assets/smb_powerup.wav');
    this.jumpSmall = new Audio('assets/smb_jump-small.wav');
    this.jumpSuper = new Audio('assets/smb_jump-super.wav');
  }

  /** Returns true if Konami mode is active. */
  isKonamiActive(): boolean {
    return this.konamiActive;
  }

  /** Returns the current line colors. */
  getLineColors(): string[] {
    return this.lineColors;
  }

  /** Activates Konami mode, updates colors, plays sound, and persists state. */
  activateKonami(): void {
    this.lineColors = ['#E52521', '#0090FF', '#FFD700', '#43B047']; // Mario colors
    this.konamiActive = true;
    localStorage.setItem('konamiActive', 'true');
    this.playPowerupSound();
  }

  /** Plays the powerup sound effect. */
  playPowerupSound(): void {
    this.powerup.currentTime = 0;
    this.powerup.play();
  }

  /** Plays the jump small sound effect. */
  playJumpSmall(): void {
    this.jumpSmall.currentTime = 0;
    this.jumpSmall.play();
  }

  /** Plays the jump super sound effect. */
  playJumpSuper(): void {
    this.jumpSuper.currentTime = 0;
    this.jumpSuper.play();
  }

  /** Restores Konami state from localStorage. */
  restoreKonamiState(): void {
    if (localStorage.getItem('konamiActive') === 'true') {
      this.lineColors = ['#E52521', '#0090FF', '#FFD700', '#43B047'];
      this.konamiActive = true;
    }
  }

  /** Adds the global event listener for Konami activation. */
  private addKonamiEventListener(): void {
    if (!KonamiMarioService.konamiEventListenerAdded) {
      window.addEventListener('konami-mario', () => {
        this.activateKonami();
      });
      KonamiMarioService.konamiEventListenerAdded = true;
    }
  }
} 