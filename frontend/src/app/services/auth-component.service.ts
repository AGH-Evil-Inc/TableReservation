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

  private isAdminSubject = new BehaviorSubject<boolean>(localStorage.getItem('isAdmin') === 'true');
  isAdminIn$ = this.isAdminSubject.asObservable();

  login(userName: string, token: string, isAdmin: boolean) {
    localStorage.setItem('token', token);
    localStorage.setItem('userName', userName);
    localStorage.setItem('isAdmin', isAdmin.toString());
    this.isLoggedInSubject.next(true);
    this.isAdminSubject.next(true);
    this.userNameSubject.next(userName);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('isAdmin');
    this.isLoggedInSubject.next(false);
    this.userNameSubject.next(null);
    this.isAdminSubject.next(false);
    this.router.navigate(['/home']);
  }
}
