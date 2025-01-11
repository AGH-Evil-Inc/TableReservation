import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginData } from 'src/app/core/modules/auth';
import { AuthService } from 'src/app/services/auth.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { RegisterComponent } from '../register/register.component';
import { AuthComponentService } from 'src/app/services/auth-component.service';
import { ForgotPasswordComponent } from '../forgot-password/forgot-password.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  user: LoginData = { email: '', password: '' };
  message: string = '';
  isLoggedIn: boolean = false;

  constructor(private authService: AuthService,private authComponentService: AuthComponentService,private dialog: MatDialog, private router: Router, private dialogRef: MatDialogRef<LoginComponent>) {}

  login() {
    this.authService.login(this.user).subscribe(
      response => {
        if (response.token) {
          const isAdmin = response.isAdmin.toString() === 'true';
          localStorage.setItem('isAdmin', isAdmin.toString());
          console.log('isAdmin:', isAdmin);
          this.authComponentService.login(response.name,response.token, isAdmin);
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
    document.body.classList.add('no-scroll');
    const dialogRef = this.dialog.open(RegisterComponent, {
      width: '500px'
    });
    dialogRef.afterClosed().subscribe(() => {
      this.isLoggedIn = !!localStorage.getItem('token');
      document.body.classList.remove('no-scroll');
    });
    this.closeDialog();
  }

  forgotPassword() {
    document.body.classList.add('no-scroll');
    const dialogRef = this.dialog.open(ForgotPasswordComponent, {
      width: '400px'
    });
    dialogRef.afterClosed().subscribe(() => {
      document.body.classList.remove('no-scroll');
    });
    this.closeDialog();
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
