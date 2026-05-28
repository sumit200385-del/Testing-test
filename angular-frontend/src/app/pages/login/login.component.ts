import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LucideAngularModule, Cpu, Eye, EyeOff, LogIn } from 'lucide-angular';

interface DemoAccount {
  role: string;
  email: string;
  password: string;
  color: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
            <lucide-icon [img]="CpuIcon" [size]="32" class="text-white"></lucide-icon>
          </div>
          <h1 class="text-3xl font-bold text-blue-400">abckedn</h1>
          <p class="text-gray-400 mt-1 text-sm">VTD Firmware Testing Protocol</p>
        </div>

        <!-- Login Card -->
        <div class="bg-gray-800 rounded-2xl border border-gray-700 p-6 shadow-xl">
          <h2 class="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          <!-- Error message -->
          @if (errorMessage()) {
            <div class="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
              <p class="text-red-400 text-sm">{{ errorMessage() }}</p>
            </div>
          }

          <!-- Form -->
          <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Email address</label>
                <input
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  class="block w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <div class="relative">
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    [(ngModel)]="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    class="block w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 pr-10 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    (click)="showPassword.set(!showPassword())"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    @if (showPassword()) {
                      <lucide-icon [img]="EyeOffIcon" [size]="16"></lucide-icon>
                    } @else {
                      <lucide-icon [img]="EyeIcon" [size]="16"></lucide-icon>
                    }
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              [disabled]="loading()"
              class="mt-6 w-full btn-primary justify-center py-2.5"
            >
              <lucide-icon [img]="LogInIcon" [size]="16"></lucide-icon>
              @if (loading()) {
                Signing in...
              } @else {
                Sign in
              }
            </button>
          </form>
        </div>

        <!-- Demo accounts -->
        <div class="mt-6 bg-gray-800 rounded-2xl border border-gray-700 p-4">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Demo Access</p>
          <div class="space-y-2">
            @for (account of demoAccounts; track account.role) {
              <button
                type="button"
                (click)="fillDemoAccount(account)"
                class="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-600 hover:border-blue-500 hover:bg-gray-700 transition-colors group"
              >
                <span class="text-sm text-gray-300 group-hover:text-white">{{ account.email }}</span>
                <span [class]="'text-xs font-medium px-2 py-0.5 rounded-full ' + account.color">
                  {{ account.role }}
                </span>
              </button>
            }
          </div>
          <p class="text-xs text-gray-500 mt-3">Password for all demo accounts: <span class="text-gray-400 font-mono">password123</span></p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  CpuIcon = Cpu;
  EyeIcon = Eye;
  EyeOffIcon = EyeOff;
  LogInIcon = LogIn;

  email = '';
  password = '';
  loading = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');

  demoAccounts: DemoAccount[] = [
    { role: 'ADMIN', email: 'admin@vtd.com', password: 'password123', color: 'bg-purple-900 text-purple-300' },
    { role: 'RD_ENGINEER', email: 'engineer@vtd.com', password: 'password123', color: 'bg-blue-900 text-blue-300' },
    { role: 'RD_HEAD', email: 'rdhead@vtd.com', password: 'password123', color: 'bg-indigo-900 text-indigo-300' },
    { role: 'OPERATIONS', email: 'ops@vtd.com', password: 'password123', color: 'bg-green-900 text-green-300' },
    { role: 'SALES', email: 'sales@vtd.com', password: 'password123', color: 'bg-orange-900 text-orange-300' },
  ];

  fillDemoAccount(account: DemoAccount): void {
    this.email = account.email;
    this.password = account.password;
    this.errorMessage.set('');
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage.set('Please enter your email and password.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.email, this.password).subscribe({
      next: (_response) => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 401) {
          this.errorMessage.set('Invalid email or password. Please try again.');
        } else if (err.status === 0) {
          this.errorMessage.set('Cannot connect to server. Please ensure the backend is running.');
        } else {
          this.errorMessage.set(err.error?.message || 'Login failed. Please try again.');
        }
      }
    });
  }
}
