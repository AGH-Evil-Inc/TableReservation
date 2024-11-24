import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ResetPassword } from 'src/app/core/modules/auth';
import { AuthService } from 'src/app/services/auth.service';
import { LoginComponent } from '../login/login.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent {
  confirmPassword: string = '';
  resetPasswordTemplate: ResetPassword = {newPassword: '', resetToken: ''};
  message: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { token: string },
    private dialogRef: MatDialogRef<ResetPasswordComponent>,
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  resetPassword(): void {
    if (this.resetPasswordTemplate.newPassword !== this.confirmPassword) {
      this.message = 'Hasła nie są zgodne.';
      return;
    }

    this.resetPasswordTemplate.resetToken = this.data.token

    this.authService.resetPassword(this.resetPasswordTemplate).subscribe(
      () => {
        this.message = 'Hasło zostało zresetowane pomyślnie!';
        setTimeout(() => this.closeDialog(), 3000); 
      },
      error => {
        this.message = 'Wystąpił błąd. Spróbuj ponownie.';
      }
    );
  }

  closeDialog(): void {
    this.dialogRef.close();
    this.router.navigate(['/home']);
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '400px'
    });
  }
}
