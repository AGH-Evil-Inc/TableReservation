import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { backApiUrl } from './modules-api-url';

@Injectable({
  providedIn: 'root',
})
export class ManagerService {
  private baseUrl = '/api/settings';

  constructor(private http: HttpClient) {}

  getSettings(): Observable<any> {
    return this.http.get(backApiUrl('/settings'));
  }

  updateSettings(settings: any): Observable<any> {
    return this.http.put(backApiUrl('/settings'), settings);
  }
}
