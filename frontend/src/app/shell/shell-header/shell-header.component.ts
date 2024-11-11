import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog';
import { tap } from 'rxjs';
import { LoginComponent } from 'src/app/auth/login/login.component';
import { AuthComponentService } from 'src/app/services/auth-component.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-shell-header',
  templateUrl: './shell-header.component.html',
  styleUrls: ['./shell-header.component.scss']
})
export class ShellHeaderComponent implements OnInit {
  isLoggedIn: boolean = false;
  userName: string | null = '';

  constructor(private dialog: MatDialog, private authComponentService: AuthComponentService, private authService: AuthService) { }

  ngOnInit() {
    this.authComponentService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });

    this.authComponentService.userName$.subscribe(name => {
      this.userName = name;
    });
  }

  openLoginDialog() {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '400px'
    });
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
