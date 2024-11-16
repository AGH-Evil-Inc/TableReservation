import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { backApiUrl } from './modules-api-url';
import { LoginData, LoginResponse, User } from '../core/modules/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  register(user: User): Observable<any> {
    return this.http.post(backApiUrl(`/auth/register`),  user );
  }

  login(user: LoginData): Observable<LoginResponse> {
    return this.http.post<{ token: string, name: string }>(backApiUrl(`/auth/login`),  user );
  }

  logout(): Observable<any> {
    return this.http.post(backApiUrl(`/auth/logout`), {});
  }
}
