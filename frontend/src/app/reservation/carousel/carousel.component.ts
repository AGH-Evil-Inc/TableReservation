import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss']
})
export class CarouselComponent implements OnInit {
  @Input() images: { 
    src: string; 
    alt: string; 
    name: string; 
    description: string; 
    id: string 
  }[] = [];
  
  currentIndex = 0;

  constructor() {}

  ngOnInit(): void {}

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
  }

  goToMenu(id: string) {
    console.log(`Przejście do pozycji menu z ID: ${id}`);
    // this.router.navigate(['/menu', id]);
  }
}
