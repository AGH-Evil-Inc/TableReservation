import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { backApiUrl, mockApiUrl } from './modules-api-url';
import { LoginPost200Response, User } from '../core/modules/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  register(user: User): Observable<any> {
    return this.http.post(backApiUrl(`/register`),  user );
  }

  login(user: User): Observable<LoginPost200Response> {
    return this.http.post<{ token: string }>(backApiUrl(`/login`),  user );
  }
}
