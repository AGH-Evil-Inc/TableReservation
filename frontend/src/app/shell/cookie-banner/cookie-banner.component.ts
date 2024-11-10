import { Component } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-cookie-banner',
  templateUrl: './cookie-banner.component.html',
  styleUrl: './cookie-banner.component.scss'
})
export class CookieBannerComponent {
  cookiesAccepted: boolean;
  showSettings = false;

  // Opcje dla poszczególnych typów plików cookies
  cookiePreferences = {
    necessary: true,
    analytics: false,
    marketing: false
  };

  constructor(private cookieService: CookieService) {
    this.cookiesAccepted = this.cookieService.check('cookiesAccepted');
  }

  acceptCookies(): void {
    this.cookieService.set('cookiesAccepted', 'true', 365);
    this.saveCookiePreferences();
    this.cookiesAccepted = true;
  }

  showCookieSettings(): void {
    this.showSettings = true;
  }

  saveSettings(): void {
    this.saveCookiePreferences();
    this.showSettings = false;
  }

  private saveCookiePreferences(): void {
    this.cookieService.set('cookiePreferences', JSON.stringify(this.cookiePreferences), 365);
  }
}
