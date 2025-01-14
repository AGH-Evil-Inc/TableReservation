import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';
import { Reservation, Table } from 'src/app/core/modules/reservation';
import { ReservationService } from 'src/app/services/reservation.service';
import { TablePlanComponent } from '../table-plan/table-plan.component';
import { ManagerService } from 'src/app/services/manager.service';
import { ReservationSchema } from 'src/app/core/modules/manager';

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
  minDuration: NgbTimeStruct = {
    hour: 0,
    minute: 0,
    second: 0
  }; 
  maxDuration: NgbTimeStruct = {
    hour: 0,
    minute: 0,
    second: 0
  };
  occupiedTables: number[] = []; 

  @ViewChild(TablePlanComponent) 
  tablePlanComponent!: TablePlanComponent;

  tables: Table[] = [];
  settings: ReservationSchema[] = [];
  
  constructor(private reservationService: ReservationService, private managerService: ManagerService) {}

  ngOnInit(): void {
    this.setMinMaxDate();
    this.subscribeToUpdates();
    this.fetchTables();
    this.fetchOccupiedTables();
    this.fetchWorkingHours();
    this.setDefaultDateTime();
  }

  ngOnDestroy(): void {
    this.reservationService.disconnectSocket();
  }

  fetchTables(): void {
    this.reservationService.getAllTables().subscribe({
      next: (tables) => {
        this.tables = tables;
        if (this.tablePlanComponent) {
          this.tablePlanComponent.tables = tables;
          this.tablePlanComponent.renderTables();
        }
      },
      error: (err) => {
        console.error('Error fetching tables:', err);
      }
    });
  }

  fetchWorkingHours() {
     this.managerService.getSettings().subscribe({
          next: (data: ReservationSchema[]) => {
            this.settings = data;
          },
          error: (error: any) => {
            console.error('Error fetching settings', error);
          }
        });
  }

  private updateDynamicDurations(date: string): void {
    let dayOfWeek = (new Date(date).getDay() - 1) % 7;
    if (dayOfWeek === -1) dayOfWeek = 6; // niedziela
  
    const currentDaySettings = this.settings.find(setting => setting.day_of_week === dayOfWeek);
    if (currentDaySettings) {
      const { min_reservation_length, max_reservation_length } = currentDaySettings;
      if (min_reservation_length !== undefined) {
        this.minDuration = this.minutesToTimeStruct(min_reservation_length);
      }
      if (max_reservation_length !== undefined) {
        this.maxDuration = this.minutesToTimeStruct(max_reservation_length);
      }
    }
  }

  private minutesToTimeStruct(minutes: number): NgbTimeStruct {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return { hour, minute, second: 0 };
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
    this.updateDynamicDurations(date);

    if (this.compareTime(duration, this.minDuration,true) ||
      this.compareTime(this.maxDuration, duration, true)) {
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

    let dayOfWeek = (new Date(date).getDay() - 1) % 7;
    if (dayOfWeek === -1) {
      dayOfWeek = 6; // niedziela
    }
    const openingTime = this.settings.find(setting => setting.day_of_week === dayOfWeek)?.opening_time || '10:00';
    let closingTime = this.settings.find(setting => setting.day_of_week === dayOfWeek)?.closing_time || '22:00';

    if( closingTime === '00:00') {
      closingTime = '24:00';
    }
    const [openingHours, openingMinutes] = openingTime.split(':').map(Number);
    const [closingHours, closingMinutes] = closingTime.split(':').map(Number);

    const openingDateTime = new Date(startDateTime);
    openingDateTime.setHours(openingHours, openingMinutes);

    const closingDateTime = new Date(startDateTime);
    closingDateTime.setHours(closingHours, closingMinutes); 
    
    const lastOpeningDateTime = new Date(startDateTime);
    lastOpeningDateTime.setHours(closingHours-1, closingMinutes+30); // Rezerwacja musi kończyć się na 30 minut przed zamknięciem

    this.updateDynamicDurations(date);

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
        if (this.tablePlanComponent) {
          this.tablePlanComponent.occupiedTables = this.occupiedTables;
          this.tablePlanComponent.renderTables(); 
        }
      },
      error: (err) => {
        console.error('Error fetching occupied tables:', err);
      }
    });
  }

  private setDefaultDateTime(): void {
    const now = new Date();
  
    // Get the current day of the week
    let dayOfWeek = (now.getDay() - 1) % 7;
    if (dayOfWeek === -1) dayOfWeek = 6; // Handle Sunday
    
    // Get today's opening and closing times
    const todaySettings = this.settings.find(setting => setting.day_of_week === dayOfWeek);
    let openingTime = todaySettings?.opening_time || '10:00';
    let closingTime = todaySettings?.closing_time || '22:00';
  
    // Adjust closing time if it's 00:00
    if (closingTime === '00:00') closingTime = '24:00';
  
    const [openingHour, openingMinute] = openingTime.split(':').map(Number);
    const [closingHour, closingMinute] = closingTime.split(':').map(Number);
  
    const openingDateTime = new Date(now);
    openingDateTime.setHours(openingHour, openingMinute, 0);
  
    const closingDateTime = new Date(now);
    closingDateTime.setHours(closingHour, closingMinute, 0);
  
    if (now >= closingDateTime) {
      // If it's after closing time, set to the next day's opening time
      now.setDate(now.getDate() + 1);
      dayOfWeek = (now.getDay() - 1) % 7;
      if (dayOfWeek === -1) dayOfWeek = 6; // Handle Sunday
      const nextDaySettings = this.settings.find(setting => setting.day_of_week === dayOfWeek);
      openingTime = nextDaySettings?.opening_time || '10:00';
      const [nextOpeningHour, nextOpeningMinute] = openingTime.split(':').map(Number);
      now.setHours(nextOpeningHour, nextOpeningMinute, 0);
    } else if (now < openingDateTime) {
      // If it's before opening time, set to today's opening time
      now.setHours(openingHour, openingMinute, 0);
    } else {
      // Otherwise, round up to the nearest full hour
      now.setMinutes(0, 0, 0);
      now.setHours(now.getHours() + 1);
    }
  
    // Set default values in the form
    this.reservationFormData.date = now.toISOString().slice(0, 10); // Format as YYYY-MM-DD
    this.reservationFormData.start_time = now.toTimeString().slice(0, 5); // Format as HH:mm
  }

  selectTable(tableId: number): void {
    if (!this.reservation.table_ids.includes(tableId)) {
      this.reservation.table_ids.push(tableId);
      this.tablePlanComponent.selectedTables=this.reservation.table_ids;
      this.tablePlanComponent.renderTables();
    } else {
      this.reservation.table_ids = this.reservation.table_ids.filter(id => id !== tableId);
      this.tablePlanComponent.selectedTables=this.reservation.table_ids;
      this.tablePlanComponent.renderTables();
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
    let dayOfWeek = (new Date(date).getDay() - 1) % 7;
    if (dayOfWeek === -1) {
      dayOfWeek = 6; // niedziela
    }
    return this.settings.find(setting => setting.day_of_week === dayOfWeek)?.opening_time || '10:00';
  }
  
  getMaxTime(date: string): string {
    if (!date) return '23:59';
    let dayOfWeek = (new Date(date).getDay() - 1) % 7;
    if (dayOfWeek === -1) {
      dayOfWeek = 6; // niedziela
    }
    const closingTime = this.settings.find(setting => setting.day_of_week === dayOfWeek)?.closing_time || '22:00';

    // Rozdziel godzinę i minutę
    const [hours, minutes] = closingTime.split(':').map(Number);

    // Utwórz obiekt Date z godziny i minuty
    const closingDateTime = new Date();
    closingDateTime.setHours(hours, minutes, 0);

    // Odejmij 30 minut
    closingDateTime.setMinutes(closingDateTime.getMinutes() - 30);

    // Zwróć czas w formacie HH:mm
    const adjustedHours = closingDateTime.getHours().toString().padStart(2, '0');
    const adjustedMinutes = closingDateTime.getMinutes().toString().padStart(2, '0');
    return `${adjustedHours}:${adjustedMinutes}`;
  }

  compareTime(first: NgbTimeStruct, second: NgbTimeStruct, isOnlyBigger: boolean=false): boolean {
    if (first.hour < second.hour) {
      return true;
    }
    if (first.hour === second.hour && first.minute < second.minute) {
       return true; 
    } 
    if (first.hour === second.hour && first.minute === second.minute && first.second < second.second) {
       return true; 
    } 
    if (first.hour === second.hour && first.minute === second.minute && first.second == second.second && !isOnlyBigger) {
      return true; 
   } 
    return false; 
  }

  adjustTime(direction: 'up' | 'down'): void {
    const [hours, minutes] = this.reservationFormData.start_time.split(':').map(Number);
    const { date, start_time, duration } = this.reservationFormData;
    const minHour = this.getMinTime(date).slice(0, 2);
    const maxHour = this.getMaxTime(date).slice(0, 2);

    let newHours = hours;
    if (direction === 'up' && newHours < Number(maxHour)) {
      newHours = (hours + 1) % 24;  
    } else if (direction === 'down' && newHours > Number(minHour)) {
      newHours = (hours - 1 + 24) % 24;  
    }

    this.reservationFormData.start_time = `${newHours}:${minutes < 10 ? '0' + minutes : minutes}`;
    this.onReservationTimeChange()
  }

  handleLayoutSave(newLayout: any[]): void {
    console.log('Nowy układ stolików:', newLayout);
    // Pobierz obecne stoliki z serwera
    this.reservationService.getAllTables().subscribe(currentTables => {
      
      // 1. Zaktualizuj istniejące stoliki i dodaj nowe
      newLayout.forEach(newTable => {
        const existingTable = currentTables.find(table => table.id === newTable.id);

        if (existingTable) {
          // Zaktualizuj dane istniejącego stolika
          this.reservationService.updateTable(newTable.id, newTable).subscribe(updatedTable => {
            console.log('Stolik zaktualizowany:', updatedTable);
          });
        } else {
          // Dodaj nowy stolik
          this.reservationService.createTable(newTable).subscribe(createdTable => {
            console.log('Nowy stolik dodany:', createdTable);
          });
        }
      });

      // 2. Usuń stoliki, które zostały usunięte z układu
      currentTables.forEach(existingTable => {
        if (existingTable.id !== undefined && typeof existingTable.id === 'number') {
          const tableExistsInNewLayout = newLayout.some(newTable => newTable.id === existingTable.id);
          if (!tableExistsInNewLayout) {
            // Usuń stolik, jeśli nie znajduje się w nowym układzie
            this.reservationService.deleteTable(existingTable.id).subscribe(() => {
              console.log('Stolik usunięty:', existingTable.id);
            });
          }
        }
      });

    }, error => {
      console.error('Błąd pobierania stolików:', error);
    });
  }

  restoreLayout(occupied: Table[]): void {
    this.fetchTables()
  }
}
