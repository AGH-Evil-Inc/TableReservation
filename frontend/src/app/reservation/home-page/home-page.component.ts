import { Component, OnInit, AfterViewInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { ResetPasswordComponent } from 'src/app/auth/reset-password/reset-password.component';


@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit{
  token: string | null = null;

  constructor(private route: ActivatedRoute, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token');
      if (this.token) {
        this.openResetPasswordDialog(this.token);
      }
    });
  }

  openResetPasswordDialog(token: string): void {
    this.dialog.open(ResetPasswordComponent, {
      data: { token }, // Przekazanie tokena do dialogu
      width: '400px'
    });
  }

}
