import { Component } from '@angular/core'
import { MatDialog } from '@angular/material/dialog';
import { LoginComponent } from 'src/app/auth/login/login.component';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-shell-header',
  templateUrl: './shell-header.component.html',
  styleUrls: ['./shell-header.component.scss']
})
export class ShellHeaderComponent {
  isLoggedIn: boolean = false;

  constructor(private dialog: MatDialog, private authService: AuthService) { }

  openLoginDialog() {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '400px'
    });
    dialogRef.afterClosed().subscribe(() => {
      this.isLoggedIn = !!localStorage.getItem('token');
    });
  }

  logout() {
    this.authService.logout();
    localStorage.removeItem('token');
    this.isLoggedIn = false;
  }
}
