import { Component, OnInit } from '@angular/core';
import { Reservation } from 'src/app/core/modules/reservation';
import { ReservationService } from 'src/app/services/reservation.service';

@Component({
  selector: 'app-reservation-page',
  templateUrl: './reservation-page.component.html',
  styleUrl: './reservation-page.component.scss'
})
export class ReservationPageComponent implements OnInit{
  reservation: Reservation = {
    table_id: 0,
    reservation_start: '',
    reservation_end: ''
  };
  occupiedTables: number[] = [];
  updates: any[] = [];

  constructor(private reservationService: ReservationService) {}

  ngOnInit(): void {
    this.setInitialReservationTimes();
    this.reservationService.onReservationUpdate().subscribe((update) => {
      this.updates.push(update);
      this.fetchOccupiedTables();
    });
    this.fetchOccupiedTables();
  }

  setInitialReservationTimes(): void {
    const now = new Date();
    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);
    this.reservation.reservation_start = this.formatDate(now);
    this.reservation.reservation_end = this.formatDate(oneHourLater);
 }

  formatDate(date: Date): string { 
    const year = date.getFullYear(); 
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0'); 
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  submitReservation(): void {
    this.reservationService.createReservation(this.reservation).subscribe({
      next: () => {
        alert('Reservation created successfully!');
        this.reservation = { table_id: 0, reservation_start: '', reservation_end: '' };
        this.fetchOccupiedTables();
      },
      error: (err) => {
        alert(`Error: ${err.message}`);
      }
    });
  }

  onReservationTimeChange(): void {
    if (!this.reservation.reservation_start || !this.reservation.reservation_end) {
      this.occupiedTables = []; 
      return;
    }
  
    this.fetchOccupiedTables();
  }

  fetchOccupiedTables(): void {
    if (!this.reservation.reservation_start || !this.reservation.reservation_end) {
      alert('Please provide both start and end times for the reservation.');
      return;
    }
  
    this.reservationService.getOccupiedTables(this.reservation.reservation_start, this.reservation.reservation_end).subscribe({
      next: (response) => {
        this.occupiedTables = response.occupied_table_ids || [];
      },
      error: (err) => {
        alert(`Error fetching occupied tables: ${err.message}`);
      }
    });
  }
}
