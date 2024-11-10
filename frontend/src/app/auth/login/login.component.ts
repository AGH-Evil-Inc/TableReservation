import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginData } from 'src/app/core/modules/auth';
import { AuthService } from 'src/app/services/auth.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { RegisterComponent } from '../register/register.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  user: LoginData = { email: '', password: '' };
  message: string = '';
  isLoggedIn: boolean = false;

  constructor(private authService: AuthService,private dialog: MatDialog, private router: Router, private dialogRef: MatDialogRef<LoginComponent>) {}

  checkLoginStatus() {
    this.isLoggedIn = !!localStorage.getItem('token');
  }

  login() {
    this.authService.login(this.user).subscribe(
      response => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          this.closeDialog();
        } else {
          this.message = 'Login failed! Invalid credentials.';
        }
      },
      error => {
        this.message = 'Login failed! Invalid credentials.';
      }
    );
  }

  goToRegister() {
    const dialogRef = this.dialog.open(RegisterComponent, {
      width: '500px'
    });
    dialogRef.afterClosed().subscribe(() => {
      this.isLoggedIn = !!localStorage.getItem('token');
    });
    this.closeDialog();
  }

  forgotPassword() {
    this.closeDialog();
    this.router.navigate(['/forgot-password']);
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
