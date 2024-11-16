import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { backApiUrl } from './modules-api-url';
import { LoginData, LoginResponse, User } from '../core/modules/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private token: string | null = null;

  constructor(private http: HttpClient) { }

  register(user: User): Observable<any> {
    return this.http.post(backApiUrl(`/auth/register`),  user, {withCredentials:true} );
  }

  login(user: LoginData): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(backApiUrl(`/auth/login`), user, {withCredentials:true})
        .pipe(tap(response => {
          localStorage.setItem('token', response.token);
        }));
  }


   // Logout method
   logout(): Observable<any> {
    return this.http.post(backApiUrl(`/auth/logout`), {}, { headers: this.createAuthHeaders() })
      .pipe(tap(() => {
        // Clear the token from localStorage
        localStorage.removeItem('token');
      }));
  }

  // Helper method to create authorization headers with the stored token
  private createAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : new HttpHeaders();
  }

}
