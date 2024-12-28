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
    gantt.config['xml_date'] = '%Y-%m-%d %H:%i';
    gantt.init(this.ganttContainer.nativeElement);

    this.managerService.getReservations().then((reservations) => {
      // Pobranie unikalnych ID stolików
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

    const data = filteredReservations.map((reservation) => ({
      id: reservation.id,
      text: `Rezerwacja ${reservation.id}`,
      start_date: this.formatDate(reservation.reservation_start),
      end_date: this.formatDate(reservation.reservation_end),
    }));

    gantt.clearAll();
    gantt.parse({ data });
  }

  onTableSelect(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedTable = parseInt(selectElement.value, 10);
    this.managerService.getReservations().then((reservations) => {
      this.loadReservations(reservations);
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
