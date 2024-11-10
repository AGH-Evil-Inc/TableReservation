import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { LoginComponent } from 'src/app/auth/login/login.component';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private dialog: MatDialog) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const token = localStorage.getItem('token');

    if (token) {
      return true;
    } else {
      return new Promise((resolve) => {
        const dialogRef = this.dialog.open(LoginComponent, {
          width: '400px'
        });

        dialogRef.afterClosed().subscribe(() => {
          resolve(!!localStorage.getItem('token'));
        });
      });
    }
  }
}
