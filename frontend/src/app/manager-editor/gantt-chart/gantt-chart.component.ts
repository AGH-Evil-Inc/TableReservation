import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ReservationService } from './../../services/reservation.service';
import { gantt } from 'dhtmlx-gantt';
import { ManagerService } from 'src/app/services/manager.service';
import { UpdateReservation } from 'src/app/core/modules/manager';


@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-gantt-chart',
  styleUrls: ['./gantt-chart.component.scss'],
  providers: [ManagerService],
  templateUrl: './gantt-chart.component.html',
})
export class GanttComponent implements OnInit {
  @ViewChild('gantt_here', { static: true }) ganttContainer!: ElementRef;
  tableIds: number[] = [];
  selectedTable: number | null = null;

  constructor(private managerService: ManagerService) {}

  ngOnInit(): void {
    // Konfiguracja Gantta dla trybu tylko do odczytu
    gantt.config['scale_unit'] = 'hour'; // Skala główna: godziny
    gantt.config['step'] = 2; // Krok: co godzinę
    gantt.config['date_scale'] = '%H'; // Format: godziny:minuty
    gantt.config.date_format = "%Y-%m-%d %H:%i";
    gantt.config['subscales'] = [
      { unit: 'day', step: 1, date: '%d %M' }, // Podział na dni
    ];
    gantt.config.min_column_width = 40; // Minimalna szerokość kolumny

    gantt.config.readonly = true; // Główne ustawienie trybu tylko do odczytu
    gantt.config.drag_resize = false; // Blokada zmiany rozmiaru
    gantt.config.drag_move = false; // Blokada przesuwania
    gantt.config.drag_progress = false; // Blokada zmiany postępu
    gantt.config.details_on_create = false; // Brak edycji przy tworzeniu
    gantt.config.details_on_dblclick = false; // Brak edycji przy podwójnym kliknięciu
    gantt.config.multiselect = false; // Wyłączenie wielokrotnego wyboru
    gantt.config.select_task = false; // Brak możliwości wyboru zadań
  
    // Inicjalizacja wykresu
    gantt.init(this.ganttContainer.nativeElement);
  
    // Pobranie rezerwacji
    this.managerService.getReservations().then((reservations) => {
      this.tableIds = [...new Set((reservations as UpdateReservation[]).map((r) => r.table_id as number))];
      this.selectedTable = this.tableIds.length > 0 ? this.tableIds[0] : null;
      this.loadReservations(reservations);
    });
  }
  

  loadReservations(reservations: any[]): void {
    if (!this.selectedTable) {
      gantt.clearAll();
      return;
    }

    const filteredReservations = reservations.filter(
      (reservation) => reservation.table_id === this.selectedTable
    );

    const data = filteredReservations.map((reservation, index) => ({
      id: reservation.id,
      text: `Rezerwacja ${reservation.id}`,
      start_date: this.formatDate(reservation.reservation_start),
      end_date: this.formatDate(reservation.reservation_end),
      color: this.getReservationColor(index)
    }));

    gantt.clearAll();
    gantt.parse({ data });
  }

  private getReservationColor(index: number): string {
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F4D03F', '#8E44AD'];
    return colors[index % colors.length];
  }

  onTableSelect(event: any): void {
    this.selectedTable = event.value;
    this.managerService.getReservations().then((reservations) => {
      this.loadReservations(reservations);
    }).catch((error) => {
      console.error('Error fetching reservations', error);
    });
  }

  private formatDate(date: string | Date): string {
    const parsedDate = new Date(date);
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const hours = String(parsedDate.getHours()).padStart(2, '0');
    const minutes = String(parsedDate.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
}
