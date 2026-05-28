import { Component, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { LayoutComponent } from './shared/components/layout/layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LayoutComponent],
  template: `
    <router-outlet />
  `
})
export class AppComponent {
  private authService = inject(AuthService);
  isLoggedIn = computed(() => this.authService.isLoggedIn());
}
