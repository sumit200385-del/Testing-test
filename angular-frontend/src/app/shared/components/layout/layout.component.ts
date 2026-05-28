import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Cpu, FlaskConical, Car, Award, ScrollText, LogOut, Menu, X, ChevronRight } from 'lucide-angular';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <div class="flex h-screen bg-gray-50 overflow-hidden">
      <!-- Mobile overlay -->
      @if (sidebarOpen()) {
        <div
          class="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          (click)="sidebarOpen.set(false)"
        ></div>
      }

      <!-- Sidebar -->
      <aside
        [class]="'fixed lg:static inset-y-0 left-0 z-30 flex flex-col w-64 bg-gray-900 text-white transition-transform duration-300 ' + (sidebarOpen() ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')"
      >
        <!-- Logo / Brand -->
        <div class="flex items-center px-6 py-5 border-b border-gray-700">
          <div>
            <h1 class="text-xl font-bold text-blue-400 tracking-wide">abckedn</h1>
            <p class="text-xs text-gray-400 mt-0.5">VTD Testing Protocol</p>
          </div>
          <button
            class="ml-auto lg:hidden text-gray-400 hover:text-white"
            (click)="sidebarOpen.set(false)"
          >
            <lucide-icon [img]="XIcon" [size]="20"></lucide-icon>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <a
            routerLink="/dashboard"
            routerLinkActive="bg-blue-600 text-white"
            [routerLinkActiveOptions]="{exact: true}"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm font-medium"
            (click)="closeSidebarOnMobile()"
          >
            <lucide-icon [img]="DashboardIcon" [size]="18"></lucide-icon>
            Dashboard
          </a>

          <a
            routerLink="/firmware"
            routerLinkActive="bg-blue-600 text-white"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm font-medium"
            (click)="closeSidebarOnMobile()"
          >
            <lucide-icon [img]="CpuIcon" [size]="18"></lucide-icon>
            Firmware Versions
          </a>

          <div class="pt-3 pb-1">
            <p class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Testing Stages</p>
          </div>

          <a
            routerLink="/stage/1"
            routerLinkActive="bg-blue-600 text-white"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm font-medium"
            (click)="closeSidebarOnMobile()"
          >
            <lucide-icon [img]="FlaskIcon" [size]="18"></lucide-icon>
            Stage 1 – Sanity Test
          </a>

          <a
            routerLink="/stage/2"
            routerLinkActive="bg-blue-600 text-white"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm font-medium"
            (click)="closeSidebarOnMobile()"
          >
            <lucide-icon [img]="CarIcon" [size]="18"></lucide-icon>
            Stage 2 – Field Test
          </a>

          <a
            routerLink="/stage/3"
            routerLinkActive="bg-blue-600 text-white"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm font-medium"
            (click)="closeSidebarOnMobile()"
          >
            <lucide-icon [img]="AwardIcon" [size]="18"></lucide-icon>
            Stage 3 – Final Sign-off
          </a>

          <div class="pt-3 pb-1">
            <p class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Audit</p>
          </div>

          <a
            routerLink="/changelog"
            routerLinkActive="bg-blue-600 text-white"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm font-medium"
            (click)="closeSidebarOnMobile()"
          >
            <lucide-icon [img]="ScrollIcon" [size]="18"></lucide-icon>
            Change Log
          </a>
        </nav>

        <!-- User footer -->
        <div class="px-4 py-4 border-t border-gray-700">
          @if (currentUser()) {
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                {{ currentUser()!.name.charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-white truncate">{{ currentUser()!.name }}</p>
                <p class="text-xs text-gray-400 truncate">{{ currentUser()!.role }}</p>
              </div>
              <button
                (click)="logout()"
                class="text-gray-400 hover:text-red-400 transition-colors"
                title="Sign out"
              >
                <lucide-icon [img]="LogOutIcon" [size]="18"></lucide-icon>
              </button>
            </div>
          }
        </div>
      </aside>

      <!-- Main content area -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Mobile header -->
        <header class="lg:hidden flex items-center px-4 py-3 bg-white border-b border-gray-200">
          <button
            (click)="sidebarOpen.set(true)"
            class="text-gray-600 hover:text-gray-900"
          >
            <lucide-icon [img]="MenuIcon" [size]="24"></lucide-icon>
          </button>
          <h1 class="ml-3 text-lg font-bold text-blue-600">abckedn</h1>
        </header>

        <!-- Page content -->
        <main class="flex-1 overflow-y-auto">
          <ng-content></ng-content>
        </main>
      </div>
    </div>
  `
})
export class LayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  sidebarOpen = signal(false);
  currentUser = this.authService.currentUser;

  DashboardIcon = LayoutDashboard;
  CpuIcon = Cpu;
  FlaskIcon = FlaskConical;
  CarIcon = Car;
  AwardIcon = Award;
  ScrollIcon = ScrollText;
  LogOutIcon = LogOut;
  MenuIcon = Menu;
  XIcon = X;
  ChevronIcon = ChevronRight;

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  closeSidebarOnMobile(): void {
    if (window.innerWidth < 1024) {
      this.sidebarOpen.set(false);
    }
  }
}
