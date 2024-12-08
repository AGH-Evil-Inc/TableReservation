import { Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { faSquare, faCircle, faEllipsis, faPlay, faShapes } from '@fortawesome/free-solid-svg-icons';
import { Table } from 'src/app/core/modules/reservation';

@Component({
  selector: 'app-add-table',
  templateUrl: './add-table.component.html',
  styleUrls: ['./add-table.component.scss'],
})
export class AddTableComponent implements OnInit {
  @Input() existingIds: number[] = []; // Przekazane istniejące ID
  tableData = {
    id: 0,
    width: 80,
    height: 60,
    shape: 'rectangle', 
    tooltip: '',
    seats: 0,
    available: true
  };

  shapes = [
    { label: 'Prostokąt', value: 'rectangle', icon: faSquare },
    { label: 'Koło', value: 'circle', icon: faCircle },
    { label: 'Elipsa', value: 'ellipse', icon: faEllipsis },
    { label: 'Trójkąt', value: 'triangle', icon: faPlay },
    { label: 'Pięciokąt', value: 'pentagon', icon: faShapes },
    { label: 'Sześciokąt', value: 'hexagon', icon: faShapes },
  ];

  constructor(private dialogRef: MatDialogRef<AddTableComponent>) {}

  ngOnInit(): void {
    this.tableData.id = this.getLowestAvailableId();
  }

  getLowestAvailableId(): number {
    const sortedIds = this.existingIds.sort((a, b) => a - b);
    for (let i = 1; i <= sortedIds.length + 1; i++) {
      if (!sortedIds.includes(i)) {
        return i;
      }
    }
    return 1; 
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  saveTable(): void {
    if (this.tableData.width > 0 && this.tableData.height > 0) {
      this.dialogRef.close(this.tableData);
    } else {
      alert('Proszę wypełnić wszystkie pola poprawnie!');
    }
  }
 }
