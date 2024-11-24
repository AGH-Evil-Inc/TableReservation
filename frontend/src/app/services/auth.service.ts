import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { backApiUrl } from './modules-api-url';
import { RequestResetPassword, ResetPassword, User } from '../core/modules/auth';
import { HeartbeatService } from './heart-beat.service';
import { AuthComponentService } from './auth-component.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private token: string | null = null;

  constructor(private http: HttpClient,
    private authComponentService: AuthComponentService,
    private heartbeatService: HeartbeatService) { }

  register(user: User): Observable<any> {
    return this.http.post(backApiUrl(`/auth/register`),  user, {withCredentials:true} );
  }

  login(credentials: any) {
    return this.http.post('/api/auth/login', credentials).pipe(
      tap((response: any) => {
        this.authComponentService.login(response.userName,response.token);
        this.heartbeatService.start(); 
      })
    );
  }

  forgot_password(user_email:RequestResetPassword): Observable<any> {
    return this.http.post(backApiUrl('/auth/request-password-reset'),user_email, {withCredentials:true});
  }

  logout() {
    return this.http.post('/api/auth/logout', {}).pipe(
      tap(() => {
        this.authComponentService.logout();
        this.heartbeatService.stop();
      })
    );
  }

  resetPassword(resetPassword: ResetPassword): Observable<any> {
    return this.http.post(backApiUrl('/auth/reset-password'), resetPassword , {withCredentials:true});
  }  

}
