import { Component } from '@angular/core';
import { User } from 'src/app/core/modules/auth/model/user';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  
  user: User = { username: '', password: '' };
  message: string = '';

  constructor(private authService: AuthService) {}

  register() {
    this.authService.register(this.user).subscribe(
      response => {
        this.message = 'User registered successfully!';
      },
      error => {
        this.message = 'Registration failed!';
      }
    );
  }
}
