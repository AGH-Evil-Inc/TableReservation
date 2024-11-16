import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { backApiUrl } from './modules-api-url';
import { Reservation, ReservationGet200Response } from '../core/modules/reservation';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private reservationUpdates = new Subject<any>();

  constructor(private http: HttpClient, private socket: Socket) {
    this.socket.on('reservation_update', (data: any) => {
      this.reservationUpdates.next(data);
    });
  }

  createReservation(reservation: Reservation): Observable<any> {
    return this.http.post(backApiUrl('/reservation'), reservation);
  }

  getOccupiedTables(reservationStart: string, reservationEnd: string): Observable<ReservationGet200Response> {
    const params = { reservation_start: reservationStart, reservation_end: reservationEnd };
    return this.http.get<ReservationGet200Response>(backApiUrl('/reservation'), { params });
  }

  onReservationUpdate(): Observable<any> {
    return this.reservationUpdates.asObservable();
  }
}
