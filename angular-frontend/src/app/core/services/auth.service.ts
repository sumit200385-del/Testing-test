import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User, LoginResponse } from '../../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  currentUser = signal<User | null>(this.loadUserFromStorage());
  isLoggedIn = computed(() => !!this.currentUser());

  private loadUserFromStorage(): User | null {
    try {
      const userStr = localStorage.getItem('vtd_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  get token(): string | null {
    return localStorage.getItem('vtd_token');
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      tap(response => {
        localStorage.setItem('vtd_token', response.token);
        localStorage.setItem('vtd_user', JSON.stringify(response.user));
        this.currentUser.set(response.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('vtd_token');
    localStorage.removeItem('vtd_user');
    this.currentUser.set(null);
  }
}
