import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthComponentService {

  constructor(
    private router: Router,
  ) {}
  private isLoggedInSubject = new BehaviorSubject<boolean>(!!localStorage.getItem('token'));
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  private userNameSubject = new BehaviorSubject<string | null>(localStorage.getItem('userName'));
  userName$ = this.userNameSubject.asObservable();

  login(userName: string, token: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('userName', userName);
    this.isLoggedInSubject.next(true);
    this.userNameSubject.next(userName);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    this.isLoggedInSubject.next(false);
    this.userNameSubject.next(null);
    this.router.navigate(['/home']);
  }
}
