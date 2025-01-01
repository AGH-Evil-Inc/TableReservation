import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { LoginComponent } from '../auth/login/login.component';
import { AuthComponentService } from './auth-component.service';
import { backApiUrl, createAuthHeaders } from './modules-api-url';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HeartbeatService {
  private intervalId: any = null;

  private isAdminSubject = new BehaviorSubject<boolean>(localStorage.getItem('isAdmin') === 'true');
  isAdmin$ = this.isAdminSubject.asObservable();

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private authComponentService: AuthComponentService
  ) {}

  // Rozpoczyna heartbeat
  start() {
    if (this.intervalId) {
      console.warn('Heartbeat już działa.');
      return;
    }

    this.intervalId = setInterval(() => {
      this.checkLoginStatus().subscribe(
        (response: any) => {
          console.log('Użytkownik jest nadal zalogowany.');
          const isAdmin = response.isAdmin.toString() === 'true';
          localStorage.setItem('isAdmin', isAdmin.toString());
          console.log('isAdmin:', isAdmin);
          this.isAdminSubject.next(isAdmin);
        },
        (error) => {
          console.error('Błąd heartbeat:', error);
          if (localStorage.getItem('token')) {
            alert('Sesja wygasła. Zaloguj się ponownie.');
            this.authComponentService.logout();
            this.dialog.open(LoginComponent, { width: '400px' });
          }
          this.stop(); // Zatrzymanie heartbeat przy błędzie
        }
      );
    }, 10 * 1000); // 10 sekund
  }

  // Zatrzymuje heartbeat
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Heartbeat zatrzymany.');
    }
  }

  // Sprawdza status logowania
  private checkLoginStatus() {
    return this.http.get(backApiUrl('/auth/check-login'), {
      headers: createAuthHeaders(),
      withCredentials: true,
    });
  }
}
