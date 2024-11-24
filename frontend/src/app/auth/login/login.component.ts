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
          this.authComponentService.login(response.name,response.token)
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
    const dialogRef = this.dialog.open(ForgotPasswordComponent, {
      width: '400px'
    });
    this.closeDialog();
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
