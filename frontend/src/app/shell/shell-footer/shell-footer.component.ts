import { Component, OnInit } from '@angular/core';
import { ManagerContactInfoGet200ResponseInner, ReservationSchema } from 'src/app/core/modules/manager';
import { ManagerService } from 'src/app/services/manager.service';

@Component({
  selector: 'app-shell-footer',
  templateUrl: './shell-footer.component.html',
  styleUrls: ['./shell-footer.component.scss']
})
export class ShellFooterComponent implements OnInit {
  openingHours: { day: string; hours: string }[] = [];
  contactInfo: ManagerContactInfoGet200ResponseInner | null = {};

  constructor(private settingsService: ManagerService) {}

  ngOnInit(): void {
    this.settingsService.getSettings().subscribe((settings) => {
      this.openingHours = this.formatOpeningHours(settings);
    });

    this.loadContactInfo()
  }

  private formatOpeningHours(settings: ReservationSchema[]): { day: string; hours: string }[] {
    const daysOfWeek = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];

    return settings.map((setting) => ({
      day: daysOfWeek[setting.day_of_week ? parseInt(setting.day_of_week.toString(), 10) % 7 : 0],
      hours: setting.opening_time && setting.closing_time
        ? `${setting.opening_time} - ${setting.closing_time}`
        : 'Zamknięte',
    }));
  }

  loadContactInfo(): void {
    this.settingsService.getContactInfo().subscribe(
      (data: any) => {
        this.contactInfo = data[0];
      },
      (error) => {
        console.error('Error fetching contact info:', error);
      }
    );
  }
}