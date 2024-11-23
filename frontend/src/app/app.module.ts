import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';
import { RegisterComponent } from './auth/register/register.component';
import { LoginComponent } from './auth/login/login.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { HomePageComponent } from './reservation/home-page/home-page.component';
import { ShellFooterComponent } from './shell/shell-footer/shell-footer.component';
import { ShellHeaderComponent } from './shell/shell-header/shell-header.component';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { MdbAccordionModule } from 'mdb-angular-ui-kit/accordion';
import { MdbCarouselModule } from 'mdb-angular-ui-kit/carousel';
import { MdbCheckboxModule } from 'mdb-angular-ui-kit/checkbox';
import { MdbCollapseModule } from 'mdb-angular-ui-kit/collapse';
import { MdbDropdownModule } from 'mdb-angular-ui-kit/dropdown';
import { MdbFormsModule } from 'mdb-angular-ui-kit/forms';
import { MdbModalModule } from 'mdb-angular-ui-kit/modal';
import { MdbPopoverModule } from 'mdb-angular-ui-kit/popover';
import { MdbRadioModule } from 'mdb-angular-ui-kit/radio';
import { MdbRangeModule } from 'mdb-angular-ui-kit/range';
import { MdbRippleModule } from 'mdb-angular-ui-kit/ripple';
import { MdbScrollspyModule } from 'mdb-angular-ui-kit/scrollspy';
import { MdbTabsModule } from 'mdb-angular-ui-kit/tabs';
import { MdbTooltipModule } from 'mdb-angular-ui-kit/tooltip';
import { MdbValidationModule } from 'mdb-angular-ui-kit/validation';
import { CookieModule } from 'ngx-cookie';
import { CookieBannerComponent } from './shell/cookie-banner/cookie-banner.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDialogModule } from '@angular/material/dialog'
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardActions } from '@angular/material/card';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { AuthComponentService } from './services/auth-component.service';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { ReservationPageComponent } from './reservation/reservation-page/reservation-page.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ReservationPageNologgedComponent } from './reservation/reservation-page-nologged/reservation-page-nologged.component';
import { NgxMatTimepickerModule } from 'ngx-mat-timepicker';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { CarouselComponent } from './reservation/carousel/carousel.component';
import { ComingSoonComponent } from './shell/coming-soon/coming-soon.component';

const config: SocketIoConfig = { url: 'http://127.0.0.1:5000', options: {} };

@NgModule({ declarations: [
        AppComponent,
        RegisterComponent,
        LoginComponent,
        HomePageComponent,
        ShellFooterComponent,
        ShellHeaderComponent,
        CookieBannerComponent,
        ReservationPageComponent,
        ForgotPasswordComponent,
        ResetPasswordComponent,
        ReservationPageNologgedComponent,
        CarouselComponent,
        ComingSoonComponent
    ],
    bootstrap: [AppComponent],
    imports: [BrowserModule,
        AppRoutingModule,
        FormsModule,
        BrowserAnimationsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        MatSnackBarModule,
        MdbAccordionModule,
        MatCardModule,
        MatCardActions,
        MdbCarouselModule,
        MdbCheckboxModule,
        MdbCollapseModule,
        MdbDropdownModule,
        MdbFormsModule,
        MdbModalModule,
        MdbPopoverModule,
        MdbRadioModule,
        MdbRangeModule,
        MatTooltipModule,
        SocketIoModule.forRoot(config),
        CookieModule.forRoot(),
        NgbTimepickerModule,
        NgxMatTimepickerModule,
        TimepickerModule,
        MdbRippleModule,
        MdbScrollspyModule,
        MdbTabsModule,
        MdbTooltipModule,
        MdbValidationModule], providers: [
        AuthService,
        AuthComponentService,
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimations(),
        provideAnimationsAsync()
    ] })
export class AppModule { }
