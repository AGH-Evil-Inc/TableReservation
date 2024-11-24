import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginComponent } from 'src/app/auth/login/login.component';

@Component({
  selector: 'app-reservation-page-nologged',
  templateUrl: './reservation-page-nologged.component.html',
  styleUrls: ['./reservation-page-nologged.component.scss'],
})
export class ReservationPageNologgedComponent {
  constructor(
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  openLoginDialog() {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe(() => {
      if (localStorage.getItem('token')) {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        this.router.navigate([returnUrl]);
      }
    });
  }
}
