import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { tap } from 'rxjs';
import { LoginComponent } from 'src/app/auth/login/login.component';
import { AuthComponentService } from 'src/app/services/auth-component.service';
import { AuthService } from 'src/app/services/auth.service';
import { HeartbeatService } from 'src/app/services/heart-beat.service';
import { SessionTimerService } from 'src/app/services/session-tImer.service';

@Component({
  selector: 'app-shell-header',
  templateUrl: './shell-header.component.html',
  styleUrls: ['./shell-header.component.scss']
})
export class ShellHeaderComponent implements OnInit {
  isLoggedIn: boolean = false;
  userName: string | null = '';
  remainingTime: number = 0;
  isMenuOpen: boolean = false;
  isUserManager = localStorage.getItem('isAdmin') === 'true';

  constructor(private dialog: MatDialog, private authComponentService: AuthComponentService,
     private authService: AuthService, private sessionTimerService: SessionTimerService,
     private heartbeatService: HeartbeatService) { }

  ngOnInit() {
    // Subskrypcja na status logowania
    this.authComponentService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });

    this.authComponentService.isLoggedIn$.subscribe(isAdmin => {
      this.isUserManager = isAdmin;
    });

    // Subskrypcja na nazwisko użytkownika
    this.authComponentService.userName$.subscribe(name => {
      this.userName = name;
    });

    // Subskrypcja na pozostały czas
    this.sessionTimerService.remainingTime.subscribe(time => {
      this.remainingTime = time;
    });
    if(this.isLoggedIn){
      this.heartbeatService.start(); 
    }
  }

  openLoginDialog() {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '400px'
    });
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secondsLeft = seconds % 60;
    return `${minutes}:${secondsLeft < 10 ? '0' + secondsLeft : secondsLeft}`;
  }

  toggleMobileMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
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
}
