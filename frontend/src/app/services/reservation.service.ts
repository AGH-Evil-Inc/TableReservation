import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { backApiUrl, createAuthHeaders } from './modules-api-url';
import { Reservation, ReservationGet200Response, Table } from '../core/modules/reservation';
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
    return this.http.post(backApiUrl('/reservation'), reservation,{ headers: createAuthHeaders(), withCredentials:true });
  }

  getOccupiedTables(reservationStart: string, reservationEnd: string): Observable<ReservationGet200Response> {
    const params = { reservation_start: reservationStart, reservation_end: reservationEnd };
    return this.http.get<ReservationGet200Response>(backApiUrl('/reservation'), { params, headers: createAuthHeaders(), withCredentials:true });
  }

  onReservationUpdate(): Observable<any> {
    return this.reservationUpdates.asObservable();
  }

  disconnectSocket(): void {
    this.socket.disconnect();
  }

  getAllTables(): Observable<Table[]> {
    return this.http.get<Table[]>(backApiUrl('/tables'),{ headers: createAuthHeaders(), withCredentials:true });
  }

  getTableById(tableId: number): Observable<Table> {
    return this.http.get<Table>(backApiUrl(`/tables/${tableId}`), {
      headers: createAuthHeaders(),
      withCredentials: true
    });
  }
  
  createTable(table: Table): Observable<Table> {
    return this.http.post<Table>(backApiUrl('/tables'), table, {
      headers: createAuthHeaders(),
      withCredentials: true
    });
  }
  
  updateTable(tableId: number, table: Table): Observable<Table> {
    return this.http.put<Table>(backApiUrl(`/tables/${tableId}`), table, {
      headers: createAuthHeaders(),
      withCredentials: true
    });
  }
  
  deleteTable(tableId: number): Observable<void> {
    return this.http.delete<void>(backApiUrl(`/tables/${tableId}`), {
      headers: createAuthHeaders(),
      withCredentials: true
    });
  }
  
}
