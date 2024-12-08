import { Component, ElementRef, Input, Output, EventEmitter, AfterViewInit, SimpleChanges, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import gsap from 'gsap';
import Konva from 'konva';
import { AddTableComponent } from './add-table/add-table.component';
import { Table } from 'src/app/core/modules/reservation';


@Component({
  selector: 'app-table-plan',
  templateUrl: './table-plan.component.html',
  styleUrls: ['./table-plan.component.scss'],
})
export class TablePlanComponent implements AfterViewInit {
  @Input() tables: Table[] = []; 
  @Input() occupiedTables: number[] = [];
  @Input() selectedTables: number[] = [];
  @Input() isManager: boolean = false; 
  @Output() tableSelected = new EventEmitter<number>();
  @Output() layoutSaved = new EventEmitter<Table[]>(); 
  @Output() restore = new EventEmitter<any>();

  private stage!: Konva.Stage;
  private layer!: Konva.Layer;
  private scale = 1; 
  private baseWidth = 1000; 
  private baseHeight = 630; 

  constructor(private elementRef: ElementRef, private dialog: MatDialog) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initStage();
    });
  }

  initStage(): void {
    const container = this.elementRef.nativeElement.querySelector('#canvas-container');

    if (container) {
      const { offsetWidth, offsetHeight } = container;

      this.stage = new Konva.Stage({
        container,
        width: offsetWidth,
        height: offsetHeight,
        listening: true,
      });

      this.layer = new Konva.Layer();
      this.layer.listening(true);
      this.stage.add(this.layer);
      console.log(this.tables)

      this.updateScale();
      this.renderTables();
    } else {
      console.error('Canvas container not found!');
    }
  }

  updateScale(): void {
    const container = this.elementRef.nativeElement.querySelector('#canvas-container');
    if (container) {
      const { offsetWidth, offsetHeight } = container;

      const scaleWidth = offsetWidth / this.baseWidth;
     
      this.scale = Math.min(scaleWidth,1);

      this.stage.width(this.baseWidth * this.scale);
      this.stage.height(this.baseHeight * this.scale);
      this.stage.scale({ x: this.scale, y: this.scale });
    }
  }

  renderTables(): void {
    this.layer.destroyChildren();
    this.layer.listening(true);
    this.tables.forEach((table) => {
      if (typeof table.id === 'number'){
        const isOccupied = this.occupiedTables.includes(table.id);
        const isSelected = this.selectedTables.includes(table.id);
      
  
        let shape;
        let tableText;
        let tooltip;

        if (table.shape === 'circle') {
          shape = new Konva.Circle({
            x: table.x,
            y: table.y,
            radius: table.width,
            fill: isOccupied ? '#f8d7da' : isSelected ? '#d4edda' : '#eff6fa',
            stroke: isOccupied ? '#dc3545' : isSelected ? '#28a745' : '#1976d2',
            strokeWidth: 2,
            draggable: this.isManager,
            listening: true,
            id: `${table.id}`,
          });
        } else if (table.shape === 'ellipse') {
          shape = new Konva.Ellipse({
            x: table.x,
            y: table.y,
            radiusX: table.width,
            radiusY: table.height,
            fill: isOccupied ? '#f8d7da' : isSelected ? '#d4edda' : '#eff6fa',
            stroke: isOccupied ? '#dc3545' : isSelected ? '#28a745' : '#1976d2',
            strokeWidth: 2,
            draggable: this.isManager,
            listening: true,
            id: `${table.id}`,
          });
        } else if (table.shape === 'triangle') {
          shape = new Konva.RegularPolygon({
            x: table.x,
            y: table.y,
            sides: 3,
            radius: table.width,
            fill: isOccupied ? '#f8d7da' : isSelected ? '#d4edda' : '#eff6fa',
            stroke: isOccupied ? '#dc3545' : isSelected ? '#28a745' : '#1976d2',
            strokeWidth: 2,
            draggable: this.isManager,
            listening: true,
            id: `${table.id}`,
          });
        } else if (table.shape === 'hexagon') {
          shape = new Konva.RegularPolygon({
            x: table.x,
            y: table.y,
            sides: 6,
            radius: table.width,
            fill: isOccupied ? '#f8d7da' : isSelected ? '#d4edda' : '#eff6fa',
            stroke: isOccupied ? '#dc3545' : isSelected ? '#28a745' : '#1976d2',
            strokeWidth: 2,
            draggable: this.isManager,
            listening: true,
            id: `${table.id}`,
          });
        } else if (table.shape === 'pentagon') {
          shape = new Konva.RegularPolygon({
            x: table.x,
            y: table.y,
            sides: 5,
            radius: table.width,
            fill: isOccupied ? '#f8d7da' : isSelected ? '#d4edda' : '#eff6fa',
            stroke: isOccupied ? '#dc3545' : isSelected ? '#28a745' : '#1976d2',
            strokeWidth: 2,
            draggable: this.isManager,
            listening: true,
            id: `${table.id}`,
          });
          
        } else {
          shape = new Konva.Rect({
            x: table.x,
            y: table.y,
            width: table.width,
            height: table.height,
            fill: isOccupied ? '#f8d7da' : isSelected ? '#d4edda' : '#eff6fa',
            stroke: isOccupied ? '#dc3545' : isSelected ? '#28a745' : '#1976d2',
            strokeWidth: 2,
            cornerRadius: 5,
            draggable: this.isManager,
            listening: true,
            id: `${table.id}`,
          });
        }


        // Tworzymy tekst z identyfikatorem stolika
        tableText = new Konva.Text({
          x: table.x,
          y: table.y,
          text: `${table.id} (${table.seats} os)`,
          fontSize: 14,
          fontFamily: 'Arial',
          fill: '#000',
          visible: true,
        });

        // Tooltip
        tooltip = new Konva.Text({
          x: Math.min(table.x + 20,1000),
          y: Math.max(table.y - 60,0), 
          text: table.tooltip,
          fontSize: 12,
          fontFamily: 'Arial',
          fill: '#000',
          backgroundColor: '#000',
          padding: 5,
          visible: false,  
        });

        shape.on('mouseover', () => {
          tooltip.visible(true);
          this.layer.batchDraw();
        });

        shape.on('mouseout', () => {
          tooltip.visible(false);
          this.layer.batchDraw();
        });
        
    
        if (!this.isManager) {
          shape.on('click', (event) => {
            if (!isOccupied) {
              const pointerPosition = this.stage.getPointerPosition();
              if (pointerPosition) {
            
                  this.tableSelected.emit(table.id);
                  this.renderTables();
              }
            }
          });
        } else {
          let resizeHandle: Konva.Circle;

          if (table.shape === 'circle') {
            resizeHandle = new Konva.Circle({
              x: table.x + table.width,  // Dla koła kropka będzie na prawej krawędzi
              y: table.y,  // Wysokość koła
              radius: 8,
              fill: '#000',
              stroke: '#fff',
              strokeWidth: 2,
              draggable: true,
            });
          } else if (table.shape === 'ellipse') {
            resizeHandle = new Konva.Circle({
              x: table.x + table.width,  // Dla elipsy kropka będzie na prawej krawędzi
              y: table.y,  // Wysokość elipsy
              radius: 8,
              fill: '#000',
              stroke: '#fff',
              strokeWidth: 2,
              draggable: true,
            });
          } else if (table.shape === 'triangle') {
            // Dla trójkąta kropka powinna być na dolnym prawym rogu
            resizeHandle = new Konva.Circle({
              x: table.x + table.width / 2,  // Środek trójkąta
              y: table.y + table.height,  // Na dole
              radius: 8,
              fill: '#000',
              stroke: '#fff',
              strokeWidth: 2,
              draggable: true,
            });
          } else if (table.shape === 'hexagon') {
            // Dla sześciokąta kropka powinna być na prawym dolnym rogu
            resizeHandle = new Konva.Circle({
              x: table.x + table.width / 2,  // Środek sześciokąta
              y: table.y + table.height,  // Na dole
              radius: 8,
              fill: '#000',
              stroke: '#fff',
              strokeWidth: 2,
              draggable: true,
            });
          } else if (table.shape === 'pentagon') {
            // Dla pięciokąta kropka powinna być na prawym dolnym rogu
            resizeHandle = new Konva.Circle({
              x: table.x + table.width / 2,  // Środek pięciokąta
              y: table.y + table.height,  // Na dole
              radius: 8,
              fill: '#000',
              stroke: '#fff',
              strokeWidth: 2,
              draggable: true,
            });
          } else {
            resizeHandle = new Konva.Circle({
              x: table.x + table.width,  // Dla prostokąta kropka będzie na prawej krawędzi
              y: table.y + table.height,  // Na dole prawej krawędzi
              radius: 8,
              fill: '#000',
              stroke: '#fff',
              strokeWidth: 2,
              draggable: true,
            });
          }

          resizeHandle.on('dragmove', (e) => {
            const newX = e.target.x();
            const newY = e.target.y();
            const newWidth = Math.max(newX - table.x,1);
            const newHeight = Math.max(newY - table.y,1);

            // Resize the table
            shape.width(newWidth);
            shape.height(newHeight);
            table.width = newWidth;
            table.height = newHeight;

            // Move the resize handle with the shape
            resizeHandle.x(table.x + newWidth);
            resizeHandle.y(table.y + newHeight);

            this.layer.batchDraw();
          });

          this.layer.add(resizeHandle);
        
          shape.on('dragend', (event) => {
            let { x, y } = event.target.position();
          
            // Calculate the boundary limits based on scale
            const maxX = (this.baseWidth  - shape.width());
          
            const maxY = (this.baseHeight  - shape.height());
          
            // Clamp x and y within the allowed range
            x = Math.max(0, Math.min(x, maxX));
            y = Math.max(0, Math.min(y, maxY));
          
            // Apply the clamped position
            event.target.position({ x, y });

            table.x = x ;
            table.y = y ;

            console.log(`Stolik ${table.id} przesunięty na:`, { x, y });
            this.renderTables();
          });
          
          shape.on('dblclick', () => this.deleteTable(table));
        }
        this.layer.add(shape);
        this.layer.add(tableText);
        this.layer.add(tooltip);
      }});
  
    this.layer.draw();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tables'] || changes['occupiedTables']) {
      this.renderTables();
    }
  }

  deleteTable(table: any): void {
    const tableShape = this.layer.findOne(`#${table.id}`);

    if (tableShape) {
        // Apply the removal animation to the specific table shape
        gsap.to(tableShape, { 
            opacity: 0, 
            duration: 0.5, 
            onComplete: () => {
                // Remove the table from the array after animation completes
                this.tables = this.tables.filter((t) => t.id !== table.id);
                this.renderTables();
            }
        });
    }
  }

  addTable(): void {
    const dialogRef = this.dialog.open(AddTableComponent, {
      width: '400px',
      data: {},
    });
    
    dialogRef.componentInstance.existingIds = this.tables .map(
      (table) => table.id) .filter((id): id is number => id !== undefined);
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const newTable = {
          id: result.id,
          x: this.baseWidth / 2,
          y: this.baseHeight / 2,
          width: result.width,
          height: result.shape === 'circle' ? result.width : result.height,
          shape: result.shape,
          tooltip: result.tooltip || '',
          seats: result.seats,
          available: true
        };
        this.tables.push(newTable);
        this.renderTables();
      }
    });
  }
  

  @HostListener('window:resize')
  onResize(): void {
    this.updateScale();
    this.renderTables();
  }

  saveLayout(): void {
    this.renderTables();
    this.layoutSaved.emit(this.tables); // Emit the updated layout
    alert('Układ stolików zapisany!');
  }

  restoreLayout(): void {
    this.restore.emit(this.occupiedTables);
    this.initStage();
  }
}
