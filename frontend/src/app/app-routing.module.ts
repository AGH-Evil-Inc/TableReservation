import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegisterComponent } from './auth/register/register.component';
import { AuthGuard } from './core/guards/auth.guard';
import { HomePageComponent } from './reservation/home-page/home-page.component';
import { ReservationPageComponent } from './reservation/reservation-page/reservation-page.component';
import { ReservationPageNologgedComponent } from './reservation/reservation-page-nologged/reservation-page-nologged.component';
import { ComingSoonComponent } from './shell/coming-soon/coming-soon.component';
import { ManagerEditorComponent } from './manager-editor/manager-editor.component';

const routes: Routes = [
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomePageComponent },
  { path: 'reservation', component: ReservationPageComponent, canActivate: [AuthGuard] },
  { path: 'reservation-nologged', component: ReservationPageNologgedComponent },
  { path: 'reset-password', component: HomePageComponent },
  { path: 'menu', component: ComingSoonComponent },
  { path: 'kontakt', component: ComingSoonComponent },
  { path: 'manager', component: ManagerEditorComponent },
  { path: 'about', component: ComingSoonComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
 }
