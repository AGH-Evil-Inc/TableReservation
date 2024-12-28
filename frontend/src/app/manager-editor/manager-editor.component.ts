import { Component, OnInit } from '@angular/core';
import { UpdateReservation, User } from '../core/modules/manager';
import { Reservation } from '../core/modules/reservation';
import { ManagerService } from '../services/manager.service';
import { ReservationSchema } from '../core/modules/manager';

@Component({
  selector: 'app-manager-editor',
  templateUrl: './manager-editor.component.html',
  styleUrls: ['./manager-editor.component.scss']
})
export class ManagerEditorComponent implements OnInit {
  users: User[] = [];
  reservations: UpdateReservation[] = [];
  settings: ReservationSchema[] = [];
  
  // Dodana właściwość do obsługi aktywnej zakładki
  activeTab: string = 'users'; // Domyślna zakładka

  constructor(private managerService: ManagerService) {}

  ngOnInit() {
    this.loadUsers();
    this.loadReservations();
    this.loadSettings();
  }

  loadUsers() {
    this.managerService.getUsers().subscribe((data: User[]) => {
      this.users = data;
    }, (error: any) => {
      console.error('Error fetching users', error);
    });
  }

  loadReservations(): void {
    this.managerService.getReservations().then(reservations => {
      this.reservations = reservations.map((reservation: Reservation): Reservation => ({
        ...reservation,
        reservation_start: this.formatToISO(new Date(reservation.reservation_start)),
        reservation_end: this.formatToISO(new Date(reservation.reservation_end))
      }));
    }, (error: any) => {
      console.error('Error fetching reservations', error);
    });
  }

  loadSettings() {
    this.managerService.getSettings().subscribe((data: ReservationSchema[]) => {
      this.settings = data;
    }, (error: any) => {
      console.error('Error fetching settings', error);
    });
  }

  deleteUser(userId: number) {
    this.users = this.users.filter(user => user.id !== userId);
    this.managerService.deleteUser(userId).subscribe(() => {
      this.loadUsers(); 
    }, (error: any) => {
      console.error('Error deleting user', error);
    });
  }

  deleteReservation(reservationId: number) {
    this.reservations = this.reservations.filter(reservation => reservation.id !== reservationId);
    this.managerService.deleteReservation(reservationId).subscribe(() => {
      this.loadReservations();
    }, (error: any) => {
      console.error('Error deleting reservation', error);
    });
  }

  updateSetting(setting: any): void {
    this.managerService.updateSettings([setting]).subscribe(() => {
      this.loadSettings();
    });
  }

  updateUser(userData: User) {
    this.managerService.updateUser(userData).subscribe(() => {
      this.loadUsers();
    }, (error: any) => {
      console.error('Error updating user', error);
    });
  }

  updateReservation(reservationData: any): void {
    // Dodaj jedną godzinę do daty rezerwacji
    const reservationRequest = { ...reservationData };
    reservationRequest.reservation_start = this.addOneHour(new Date(reservationData.reservation_start));
    reservationRequest.reservation_end = this.addOneHour(new Date(reservationData.reservation_end));
    this.managerService.updateReservation(reservationRequest).subscribe(() => {
      this.loadReservations();
    }, (error: any) => {
      console.error('Error updating reservation', error);
    });
  }

  private formatToISO(date: Date): string {
    return date.toISOString().slice(0, 16); // Format ISO bez sekund
  }

  private addOneHour(date: Date): string {
    date.setHours(date.getHours() + 2);
    return this.formatToISO(date);
  }
}