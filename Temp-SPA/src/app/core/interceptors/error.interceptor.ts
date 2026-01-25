import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AlertifyService } from '../services/alertify.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private alertify: AlertifyService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (!error) {
          return throwError(() => error);
        }

        const endpoint = request.url;
        const method = request.method;

        switch (error.status) {
          case 400:
            this.handle400Error(error);
            break;

          case 401:
            this.alertify.error('Your session has expired. Please log in again.');
            this.router.navigate(['/login']);
            break;

          case 403:
            this.alertify.error('You do not have permission to access this resource');
            break;

          case 404:
            console.warn(`404 Error: ${method} ${endpoint}`);
            this.router.navigateByUrl('/not-found');
            break;

          case 500:
            console.error(`500 Error: ${method} ${endpoint}`, error.error);
            this.router.navigateByUrl('/server-error');
            break;

          case 0:
            this.alertify.error('Network error - unable to connect to server. Please check your internet connection.');
            console.error(`Network Error: ${method} ${endpoint}`);
            break;

          default:
            this.alertify.error('An unexpected error occurred');
            console.error(`HTTP Error (${error.status}): ${method} ${endpoint}`, error);
            break;
        }

        return throwError(() => error);
      })
    );
  }

  private handle400Error(error: HttpErrorResponse): void {
    if (error.error?.errors && typeof error.error.errors === 'object') {
      const modalStateErrors: string[] = [];
      for (const key in error.error.errors) {
        if (Object.prototype.hasOwnProperty.call(error.error.errors, key)) {
          const value = error.error.errors[key];
          if (Array.isArray(value)) {
            modalStateErrors.push(...value);
          } else if (value) {
            modalStateErrors.push(String(value));
          }
        }
      }
      if (modalStateErrors.length > 0) {
        this.alertify.error(modalStateErrors.join('\n'));
      } else {
        this.alertify.error('Bad Request');
      }
    } else if (typeof error.error === 'string' && error.error.trim()) {
      this.alertify.error(error.error);
    } else if (error.error?.message) {
      this.alertify.error(error.error.message);
    } else {
      this.alertify.error('Bad Request - Invalid data provided');
    }
  }
}
