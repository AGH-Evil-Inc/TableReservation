import { Component, OnInit, ViewChild } from '@angular/core';
import { UpdateReservation, UpdateUser, User } from '../core/modules/manager';
import { Reservation, Table } from '../core/modules/reservation';
import { ManagerService } from '../services/manager.service';
import { ReservationSchema } from '../core/modules/manager';
import { ReservationService } from '../services/reservation.service';
import { TablePlanComponent } from '../reservation/table-plan/table-plan.component';
import { HeartbeatService } from '../services/heart-beat.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-manager-editor',
  templateUrl: './manager-editor.component.html',
  styleUrls: ['./manager-editor.component.scss']
})
export class ManagerEditorComponent implements OnInit {
  users: UpdateUser[] = [];
  reservations: UpdateReservation[] = [];
  settings: ReservationSchema[] = [];
  tables: Table[] = [];
  activeTab: string = 'users'; 
  sidenavOpened: boolean = true;
  filteredReservations: UpdateReservation[] = [];
  filterDate: string = '';
  sortOrder: 'asc' | 'desc' = 'asc';
  tableIds: number[] = [];
  selectedTable: number | null = null;
  selectedDay: number | null = null; 
  selectedSetting: ReservationSchema | null = null; 
  filteredUsers: UpdateUser[] = [];
  searchQuery: string = ''; 

  daysOfWeek = [
    { value: 0, name: 'Poniedziałek' },
    { value: 1, name: 'Wtorek' },
    { value: 2, name: 'Środa' },
    { value: 3, name: 'Czwartek' },
    { value: 4, name: 'Piątek' },
    { value: 5, name: 'Sobota' },
    { value: 6, name: 'Niedziela' }
  ];

  @ViewChild(TablePlanComponent)
  tablePlanComponent!: TablePlanComponent;
  isAdmin: boolean = localStorage.getItem('isAdmin') === 'true';

  constructor(
    private managerService: ManagerService,
    private reservationService: ReservationService,
    private heartbeatService: HeartbeatService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subskrypcja zmiany stanu isAdmin
    this.heartbeatService.isAdmin$.subscribe(isAdmin => {
      this.isAdmin = isAdmin;

      // Jeśli isAdmin jest fałszywe, przekieruj na stronę główną
      if (!this.isAdmin) {
        alert('Nie masz już uprawnień administratora. Zostaniesz przekierowany na stronę główną.');
        this.router.navigate(['/']); // Przekierowanie na stronę główną
      }
    });
    
    // Jeżeli isAdmin jest prawdziwe od razu przy inicjalizacji, załaduj dane
    if (this.isAdmin) {
      this.loadUsers();
      this.loadReservations();
      this.loadSettings();
      this.fetchTables();
    }
  }

  loadUsers(): void {
    this.managerService.getUsers().subscribe({
      next: (data: User[]) => {
        this.filteredUsers = data;
        this.users = data;
        if (!this.isAdmin) {
          // Jeśli użytkownik nie jest adminem, przeładuj stronę i przekieruj na stronę główną
          alert('Nie masz już uprawnień administratora. Zostaniesz przekierowany na stronę główną.');
          this.router.navigate(['/']); // Przekierowanie na stronę główną
          return; 
        }
      },
      error: (error: any) => {
        console.error('Error fetching users', error);
      }
    });
  }

  loadReservations(): void {
    this.managerService.getReservations().then(
      (reservations) => {
        this.reservations = reservations.map((reservation: Reservation) => ({
          ...reservation,
          reservation_start: this.formatToISO(new Date(reservation.reservation_start)),
          reservation_end: this.formatToISO(new Date(reservation.reservation_end))
        }));
        this.tableIds = [...new Set(this.reservations.map((res) => res.table_id))];
        this.filteredReservations = [...this.reservations];
        this.applyFilters();
      },
      (error: any) => {
        console.error('Error fetching reservations', error);
      }
    );
  }

  loadSettings(): void {
    this.managerService.getSettings().subscribe({
      next: (data: ReservationSchema[]) => {
        this.settings = data;
      },
      error: (error: any) => {
        console.error('Error fetching settings', error);
      }
    });
  }

  deleteUser(userId: number): void {
    this.managerService.deleteUser(userId).subscribe({
      next: () => this.loadUsers(),
      error: (error: any) => {
        console.error('Error deleting user', error);
      }
    });
  }

  deleteReservation(reservationId: number): void {
    this.managerService.deleteReservation(reservationId).subscribe({
      next: () => this.loadReservations(),
      error: (error: any) => {
        console.error('Error deleting reservation', error);
      }
    });
  }

  updateSetting(setting: ReservationSchema): void {
    const formattedSettings: Record<string, any> = {
      [String(setting.day_of_week)]: {
        opening_time: setting.opening_time,
        closing_time: setting.closing_time,
        min_reservation_length: setting.min_reservation_length,
        max_reservation_length: setting.max_reservation_length,
      }
    };
  
    this.managerService.updateSettings(formattedSettings).subscribe({
      next: () => this.loadSettings(),
      error: (error: any) => {
        console.error('Error updating setting', error);
      }
    });
  }

  updateUser(userData: UpdateUser): void {
    this.managerService.updateUser(userData).subscribe({
      next: () => this.loadUsers(),
      error: (error: any) => {
        console.error('Error updating user', error);
      }
    });
  }

  updateReservation(reservationData: UpdateReservation): void {
    const reservationRequest = {
      ...reservationData,
      reservation_start: this.addOneHour(new Date(reservationData.reservation_start)),
      reservation_end: this.addOneHour(new Date(reservationData.reservation_end))
    };

    this.managerService.updateReservation(reservationRequest).subscribe({
      next: () => this.loadReservations(),
      error: (error: any) => {
        console.error('Error updating reservation', error);
      }
    });
  }

  applyFilters(): void {
    this.filteredReservations = this.reservations
      .filter((reservation) =>
        this.selectedTable !== null ? reservation.table_id === this.selectedTable : true
      )
      .sort((a, b) => {
        const dateA = new Date(a.reservation_start).getTime();
        const dateB = new Date(b.reservation_start).getTime();
        return this.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
  }

  private formatToISO(date: Date): string {
    return date.toISOString().slice(0, 16); // Format ISO bez sekund
  }

  private addOneHour(date: Date): string {
    date.setHours(date.getHours() + 2);
    return this.formatToISO(date);
  }

  toggleSidenav() {
    this.sidenavOpened = !this.sidenavOpened;
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  fetchTables(): void {
    this.reservationService.getAllTables().subscribe({
      next: (tables: Table[]) => {
        this.tables = tables;
        if (this.tablePlanComponent) {
          this.tablePlanComponent.tables = tables;
          this.tablePlanComponent.renderTables();
        }
      },
      error: (err: any) => {
        console.error('Error fetching tables:', err);
      }
    });
  }

  handleLayoutSave(newLayout: Table[]): void {
    this.reservationService.getAllTables().subscribe({
      next: (currentTables) => {
        newLayout.forEach((newTable) => {
          const existingTable = currentTables.find((table) => table.id === newTable.id);
          if (existingTable && newTable.id !== undefined) {
            this.reservationService.updateTable(newTable.id, newTable).subscribe();
          } else {
            this.reservationService.createTable(newTable).subscribe();
          }
        });

        currentTables.forEach((existingTable) => {
          if (!newLayout.some((newTable) => newTable.id === existingTable.id)) {
            if (existingTable.id !== undefined) {
              this.reservationService.deleteTable(existingTable.id).subscribe();
            }
          }
        });
      },
      error: (error: any) => {
        console.error('Error saving layout:', error);
      }
    });
  }

  getDayName(dayIndex: number | undefined): string {
    if (dayIndex === undefined) {
      return 'Invalid day';
    }
    return this.daysOfWeek[dayIndex].name || 'Invalid day';
  }
  

  restoreLayout(occupied: Table[]): void {
    this.fetchTables()
  }

  onDaySelect(day: number): void {
    this.selectedDay = day;
    this.selectedSetting = this.settings.find((setting) => setting.day_of_week === day) || null;
  }

  onSearch(): void {
    const query = this.searchQuery.toLowerCase().replace(/\s+/g, '');
    this.filteredUsers = this.users.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase().replace(/\s+/g, '');
    return fullName.includes(query) || user.first_name?.toLowerCase().includes(query) || user.last_name?.toLowerCase().includes(query);
});
  }
}
