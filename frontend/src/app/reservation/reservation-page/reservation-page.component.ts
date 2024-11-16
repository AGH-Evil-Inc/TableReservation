import { Component, OnInit, OnDestroy } from '@angular/core';
import { Reservation } from 'src/app/core/modules/reservation';
import { ReservationService } from 'src/app/services/reservation.service';

@Component({
  selector: 'app-reservation-page',
  templateUrl: './reservation-page.component.html',
  styleUrls: ['./reservation-page.component.scss']
})
export class ReservationPageComponent implements OnInit, OnDestroy {
  reservation: Reservation = {
    table_id: 0,
    reservation_start: '',
    reservation_end: ''
  };

  reservationFormData = {
    date: '',
    start_time: '',
    duration: '',
  };

   // Minimalny i maksymalny czas rozpoczęcia rezerwacji
   minStartTime: string = '08:00';  // np. 8:00 AM
   maxStartTime: string = '22:00';  // np. 10:00 PM
 
   // Minimalna i maksymalna długość rezerwacji (w godzinach)
   minDuration: string = '00:15';  // minimum 15 minut
   maxDuration: string = '04:00';  // maksymalnie 4 godziny

  occupiedTables: number[] = [];
  updates: any[] = [];

  tables: { id: number; x: number; y: number }[] = [
    { id: 1, x: 50, y: 50 },
    { id: 2, x: 100, y: 50 },
    { id: 3, x: 200, y: 100 },
    { id: 4, x: 400, y: 500 },
    { id: 5, x: 800, y: 500 },
    // Dodaj więcej stołów w razie potrzeby
  ];

  constructor(private reservationService: ReservationService) {}

  ngOnInit(): void {
    this.setInitialReservationTimes();
    this.reservationService.onReservationUpdate().subscribe({
      next: (update) => {
        this.updates.push(update);
        this.fetchOccupiedTables();
      },
      error: (err) => {
        console.error('Error fetching reservation updates:', err);
      }
    });
    this.fetchOccupiedTables();
  }

  ngOnDestroy(): void {
    this.reservationService.disconnectSocket();
  }

  setInitialReservationTimes(): void {
    const now = new Date();
    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);
    this.reservation.reservation_start = this.formatToISO(now);
    this.reservation.reservation_end = this.formatToISO(oneHourLater);
  }

  formatToISO(date: Date): string {
    return date.toISOString().slice(0, 16);
  }

  submitReservation(): void {
    this.mapFormToReservation();

    this.reservationService.createReservation(this.reservation).subscribe({
      next: () => {
        this.resetReservationForm();
        this.fetchOccupiedTables();
        alert('Reservation created successfully!');
       
      },
      error: (err) => {
        console.error('Error creating reservation:', err);
        alert(`Error: ${err.message}`);
      }
    });
    this.resetReservationForm();
    this.fetchOccupiedTables();
  }

  onReservationTimeChange(): void {
    this.mapFormToReservation()
    // Sprawdzamy, czy daty rezerwacji są wprowadzone
    if (!this.reservation.reservation_start || !this.reservation.reservation_end) {
      this.occupiedTables = [];
      return;
    }

    // Sprawdzamy, czy data rozpoczęcia rezerwacji jest w przeszłości
    const currentTime = new Date();
    const reservationStart = new Date(this.reservation.reservation_start);
    const reservationEnd = new Date(this.reservation.reservation_end);

    if (reservationStart < currentTime || reservationEnd < currentTime) {
      alert("Rezerwacja nie może dotyczyć przeszłości.");
      this.occupiedTables = []; 
      return;
    }

    // Sprawdzamy, czy czas zakończenia rezerwacji nie jest wcześniejszy niż czas rozpoczęcia
    if (reservationEnd <= reservationStart) {
      alert("Czas zakończenia rezerwacji musi być późniejszy niż czas rozpoczęcia.");
      this.occupiedTables = [];
      return;
    }

    // Jeśli wszystkie warunki są spełnione, wywołujemy fetchOccupiedTables
    this.fetchOccupiedTables();
  }

  mapFormToReservation(): void {
    const { date, start_time, duration } = this.reservationFormData;

    const [startHours, startMinutes] = start_time.split(':').map(Number);
    const [durationHours, durationMinutes] = duration.split(':').map(Number);

    const startDateTime = new Date(date);
    startDateTime.setHours(startHours, startMinutes);

    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + durationHours);
    endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);

    this.reservation.reservation_start = this.formatToISO(startDateTime);
    this.reservation.reservation_end = this.formatToISO(endDateTime);
  }

  resetReservationForm(): void {
    this.reservation = { table_id: 0, reservation_start: '', reservation_end: '' };
    this.reservationFormData = { date: '', start_time: '', duration: '' };
  }

  fetchOccupiedTables(): void {
    this.mapFormToReservation()
    if (!this.reservation.reservation_start || !this.reservation.reservation_end) {
      alert('Please provide both start and end times for the reservation.');
      return;
    }

    this.reservationService.getOccupiedTables(this.reservation.reservation_start, this.reservation.reservation_end).subscribe({
      next: (response) => {
        this.occupiedTables = response.occupied_table_ids || [];
      },
      error: (err) => {
        console.error('Error fetching occupied tables:', err);
        alert(`Error fetching occupied tables: ${err.message}`);
      }
    });
  }

  onTableClick(tableId: number): void {
    this.reservation.table_id = tableId;
  }

  selectTable(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    const tables = document.querySelectorAll('.table');
    tables.forEach((table) => table.classList.remove('selected'));

    const tableId = target.getAttribute('data-id');
    if (tableId) {
      this.reservation.table_id = parseInt(tableId, 10);
      target.classList.add('selected');
    } else {
      alert('Kliknięto miejsce bez przypisanego stolika.');
    }
  }
}
