import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-coming-soon',
  templateUrl: './coming-soon.component.html',
  styleUrl: './coming-soon.component.scss'
})
export class ComingSoonComponent {

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/home']);  
  }

}
