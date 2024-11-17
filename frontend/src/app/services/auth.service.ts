import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { backApiUrl, createAuthHeaders } from './modules-api-url';
import { LoginData, LoginResponse, RequestResetPassword, ResetPassword, User } from '../core/modules/auth';


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
    return this.http.post<LoginResponse>(backApiUrl(`/auth/login`), user, {withCredentials:true});
  }

  forgot_password(user_email:RequestResetPassword): Observable<any> {
    return this.http.post(backApiUrl('/auth/request-password-reset'),user_email, {withCredentials:true});
  }

  logout(): Observable<any> {
    return this.http.post(backApiUrl(`/auth/logout`), {}, { headers: createAuthHeaders(), withCredentials:true });
  }

  resetPassword(resetPassword: ResetPassword): Observable<any> {
    return this.http.post(backApiUrl('/auth/reset-password'), resetPassword , {withCredentials:true});
  }  

}
