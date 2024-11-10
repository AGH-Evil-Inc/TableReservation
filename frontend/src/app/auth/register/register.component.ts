import { Component } from '@angular/core';
import { User } from 'src/app/core/modules/auth/model/user';
import { AuthService } from 'src/app/services/auth.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  
  user: User = { email: '', first_name: '', last_name: '', phone_number: '', password: '' };
  message: string = '';

  constructor(private authService: AuthService, private dialogRef: MatDialogRef<RegisterComponent>) {}

  register() {
    this.authService.register(this.user).subscribe(
      response => {
        this.message = 'User registered successfully!';
        this.closeDialog();
      },
      error => {
        this.message = 'Registration failed!';
      }
    );
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
