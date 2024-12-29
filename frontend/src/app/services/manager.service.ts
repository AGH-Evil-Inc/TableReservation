import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { backApiUrl } from './modules-api-url';
import { ReservationSchema, UpdateReservation, UpdateUser, User } from '../core/modules/manager';
import { Reservation } from '../core/modules/reservation';


@Injectable({
  providedIn: 'root',
})
export class ManagerService {
  private baseUrl = '/api/settings';

  constructor(private http: HttpClient) {}

  getSettings(): Observable<any> {
    return this.http.get(backApiUrl('/manager/settings'));
  }

  updateSettings(settings: ReservationSchema[]): Observable<any> {
    return this.http.put(backApiUrl('/manager/settings'), settings);
  }

  
  getUsers(): Observable<any> {
    return this.http.get(backApiUrl(`/manager/users`));
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(backApiUrl(`/manager/users/${userId}`));
  }

  updateUser(userData: UpdateUser): Observable<any> {
    return this.http.put(backApiUrl(`/manager/users/${userData.id}`), userData);
  }

  getReservations():  Promise<any> {
    return this.http.get(backApiUrl(`/manager/reservations`)).toPromise()
    .catch(HandleError);;
  }

  deleteReservation(reservationId: number): Observable<any> {
    return this.http.delete(backApiUrl(`/manager/reservations/${reservationId}`));
  }

  updateReservation(reservationData: UpdateReservation): Observable<any> {
    return this.http.put(backApiUrl(`/manager/reservations/${reservationData.id}`), reservationData);
  }
}
function HandleError(reason: any) {
  throw new Error('Function not implemented.');
}

