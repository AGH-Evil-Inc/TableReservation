import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';
import { Reservation } from 'src/app/core/modules/reservation';
import { ReservationService } from 'src/app/services/reservation.service';

@Component({
  selector: 'app-reservation-page',
  templateUrl: './reservation-page.component.html',
  styleUrls: ['./reservation-page.component.scss']
})
export class ReservationPageComponent implements OnInit, OnDestroy {
  reservation: Reservation = {
    table_ids: [],
    reservation_start: '',
    reservation_end: ''
  };

  reservationFormData = {
    date: '',
    start_time: '',
    duration: { hour: 1, minute: 0, second: 0 }
  };

  minDate: string ='';
  maxDate: string ='';
  minDuration: NgbTimeStruct = { hour: 0, minute: 15, second: 0 }; 
  maxDuration: NgbTimeStruct = { hour: 4, minute: 30, second: 0 };
  occupiedTables: number[] = []; 

  tables: { id: number; x: number; y: number, shape: string }[] = [
    { id: 1, x: 50, y: 50, shape: 'circle' },
    { id: 2, x: 100, y: 50,  shape: 'rectangle' },
    { id: 4, x: 200, y: 100, shape: 'circle' },
    { id: 3, x: 400, y: 500,  shape: 'rectangle' },
    { id: 15, x: 800, y: 500,  shape: 'rectangle' }
  ];


  constructor(private reservationService: ReservationService) {}

  ngOnInit(): void {
    this.setMinMaxDate();
    this.subscribeToUpdates();
    this.fetchOccupiedTables();
  }

  ngOnDestroy(): void {
    this.reservationService.disconnectSocket();
  }

  setMinMaxDate(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.minDate = `${year}-${month}-${day}`;

    const futureDate = new Date(today.setMonth(today.getMonth() + 4));
    const futureYear = futureDate.getFullYear();
    const futureMonth = String(futureDate.getMonth() + 1).padStart(2, '0');
    const futureDay = String(futureDate.getDate()).padStart(2, '0');
    this.maxDate = `${futureYear}-${futureMonth}-${futureDay}`
  }

  submitReservation(): void {
    this.mapFormToReservation();

    // Sprawdzenie, czy czas rezerwacji mieści się w dozwolonych godzinach
    if (!this.isReservationValid()) {
      alert('Rezerwacja przekracza dozwolony czas pracy restauracji.');
      return;
    }

    this.reservationService.createReservation(this.reservation).subscribe({
      next: () => {
        alert('Rezerwacja została utworzona pomyślnie!');
        this.resetReservationForm();
        this.fetchOccupiedTables();
      },
      error: (err) => {
        console.error('Error creating reservation:', err);
        alert(`Error: ${err.message}`);
      }
    });
  }

  onReservationTimeChange(): void {
    this.mapFormToReservation();

    if (!this.isReservationValid()) {
      alert('Nieprawidłowy czas rezerwacji.');
      return;
    }

    this.fetchOccupiedTables();
  }

  private mapFormToReservation(): void {
    const { date, start_time, duration } = this.reservationFormData;

    if (this.compareTime(duration, this.minDuration) ||
      this.compareTime(this.maxDuration, duration)) {
        alert('Nieprawidłowa długość rezerwacji.');
        return;
      }

    const [startHours, startMinutes] = start_time.split(':').map(Number);
    const startDateTime = new Date(date);
    startDateTime.setHours(startHours+1, startMinutes);

    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + duration.hour);
    endDateTime.setMinutes(endDateTime.getMinutes() + duration.minute);
  
    this.reservation.reservation_start = this.formatToISO(startDateTime);
    this.reservation.reservation_end = this.formatToISO(endDateTime);
  }

  private resetReservationForm(): void {
    this.reservation = { table_ids: [], reservation_start: '', reservation_end: '' };
    this.reservationFormData = { date: '', start_time: '', duration: { hour: 1, minute: 0, second: 0 } };
  }

  private formatToISO(date: Date): string {
    return date.toISOString().slice(0, 16); // Format ISO bez sekund
  }

  protected isReservationValid(): boolean {
    const { date, start_time, duration } = this.reservationFormData;

    const [startHours, startMinutes] = start_time.split(':').map(Number);
    const startDateTime = new Date(date);
    startDateTime.setHours(startHours, startMinutes);
    

    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + duration.hour);
    endDateTime.setMinutes(endDateTime.getMinutes() + duration.minute);

    const dayOfWeek = startDateTime.getDay();
    const openingTime = dayOfWeek >= 1 && dayOfWeek <= 5 ? '10:00' : '12:00';
    const closingTime = dayOfWeek >= 1 && dayOfWeek <= 5 ? '22:00' : '24:00';

    const [openingHours, openingMinutes] = openingTime.split(':').map(Number);
    const [closingHours, closingMinutes] = closingTime.split(':').map(Number);

    const openingDateTime = new Date(startDateTime);
    openingDateTime.setHours(openingHours, openingMinutes);

    const closingDateTime = new Date(startDateTime);
    closingDateTime.setHours(closingHours, closingMinutes); 
    
    const lastOpeningDateTime = new Date(startDateTime);
    lastOpeningDateTime.setHours(closingHours-1, closingMinutes+30); // Rezerwacja musi kończyć się na 30 minut przed zamknięciem

    return (
      startDateTime >= openingDateTime &&
      startDateTime <= lastOpeningDateTime &&
      endDateTime <= closingDateTime &&
      endDateTime > startDateTime &&
      this.compareTime(this.minDuration, duration) &&
      this.compareTime(duration, this.maxDuration)
    );
  }

  fetchOccupiedTables(): void {
  
    this.reservationService.getOccupiedTables(this.reservation.reservation_start, this.reservation.reservation_end).subscribe({
      next: (response) => {
        this.occupiedTables = response.occupied_table_ids || [];
      },
      error: (err) => {
        console.error('Error fetching occupied tables:', err);
      }
    });
  }

  selectTable(tableId: number): void {
    if (!this.reservation.table_ids.includes(tableId)) {
      this.reservation.table_ids.push(tableId);
    } else {
      this.reservation.table_ids = this.reservation.table_ids.filter(id => id !== tableId);
    }
  }

  private subscribeToUpdates(): void {
    this.reservationService.onReservationUpdate().subscribe({
      next: () => this.fetchOccupiedTables(),
      error: (err) => console.error('Error fetching reservation updates:', err)
    });
  }

  getMinTime(date: string): string {
    if (!date) return '00:00';
    const dayOfWeek = new Date(date).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6 ? '12:00' : '10:00';
  }
  
  getMaxTime(date: string): string {
    if (!date) return '23:59';
    const dayOfWeek = new Date(date).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6 ? '23:30' : '21:30';
  }

  compareTime(first: NgbTimeStruct, second: NgbTimeStruct): boolean {
    if (first.hour < second.hour) {
      return true;
    }
    if (first.hour === second.hour && first.minute < second.minute) {
       return true; 
    } 
    if (first.hour === second.hour && first.minute === second.minute && first.second < second.second) {
       return true; 
    } 
    if (first.hour === second.hour && first.minute === second.minute && first.second == second.second) {
      return true; 
   } 
    return false; 
  }

  adjustTime(direction: 'up' | 'down'): void {
    const [hours, minutes] = this.reservationFormData.start_time.split(':').map(Number);

    let newHours = hours;
    if (direction === 'up') {
      newHours = (hours + 1) % 24;  
    } else if (direction === 'down') {
      newHours = (hours - 1 + 24) % 24;  
    }

    this.reservationFormData.start_time = `${newHours}:${minutes < 10 ? '0' + minutes : minutes}`;
    this.onReservationTimeChange()
  }
}
