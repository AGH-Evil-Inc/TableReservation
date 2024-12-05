import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-table-plan',
  templateUrl: './table-plan.component.html',
  styleUrl: './table-plan.component.scss'
})
export class TablePlanComponent {
  @Input() tables: any[] = []; 
  @Input() occupiedTables: number[] = []; 
  @Input() selectedTables: number[] = []; 
  @Output() tableSelected = new EventEmitter<number>();

  selectTable(tableId: number): void {
    if (!this.occupiedTables.includes(tableId)) {
      this.tableSelected.emit(tableId);
    }
  }
}
