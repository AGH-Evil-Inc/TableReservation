import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'src/app/core/modules/auth/model/user';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  user: User = { username: '', password: '' };
  message: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.authService.login(this.user).subscribe(
      response => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          this.router.navigate(['/home']);
        } else {
          this.message = 'Login failed!';
        }
      },
      error => {
        this.message = 'Login failed!';
      }
    );
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }
}
