import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.token;

  const clonedReq = token
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(clonedReq).pipe(
    catchError(error => {
      if (error.status === 401) {
        localStorage.removeItem('vtd_token');
        localStorage.removeItem('vtd_user');
        authService.currentUser.set(null);
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
