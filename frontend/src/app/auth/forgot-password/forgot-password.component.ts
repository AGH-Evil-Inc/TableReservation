import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RequestResetPassword } from 'src/app/core/modules/auth';
import { AuthService } from 'src/app/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  user_email: RequestResetPassword = { email: '' };
  message: string = '';

  constructor(
    private authService: AuthService,
    private dialogRef: MatDialogRef<ForgotPasswordComponent>,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  forgotPassword() {
    this.authService.forgot_password(this.user_email).subscribe(
      () => {
        this.showSnackBar('Prośba o reset hasła została wysłana. Sprawdź swoją skrzynkę e-mail.', 'Zamknij');
        this.closeDialog() 
      },
      error => {
        if (error.status === 400) {
          this.message = 'Nie można wysłać prośby. Sprawdź poprawność danych.';
        } else {
          this.message = 'Wystąpił błąd. Spróbuj ponownie później.';
        }
      }
    );
  }

  showSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 5000,
      horizontalPosition: 'center', 
      verticalPosition: 'top', 
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  goToLogin() {
    this.closeDialog();
    this.router.navigate(['/login']);
  }
}
