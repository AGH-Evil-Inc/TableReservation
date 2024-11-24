import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { AuthComponentService } from './auth-component.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SessionTimerService {
  private logoutTime = 15*60;  // Czas na wylogowanie w sekundach
  private countdown = new BehaviorSubject<number>(this.logoutTime);
  private timer: any;

  constructor(private authComponentService: AuthComponentService, private authService: AuthService) {
    this.authComponentService.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.startTimer();
      } else {
        this.stopTimer();
      }
    });
  }

  startTimer() {
    if (this.timer) {
      clearInterval(this.timer); // Zatrzymaj poprzedni timer, jeśli istnieje
    }
    this.timer = setInterval(() => {
      if (this.logoutTime > 0) {
        this.logoutTime--;
        this.countdown.next(this.logoutTime);
      } else {
        this.authService.logout().pipe(
            tap({
              next: () => {
                this.authComponentService.logout();
              },
              error: (err) => {
                console.error('Logout failed', err);
              }
            })
          ).subscribe();
      }
    }, 1000);  // Odliczanie co sekundę
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer); // Zatrzymaj timer, gdy użytkownik jest wylogowany
    }
  }

  get remainingTime() {
    return this.countdown.asObservable();
  }
}
