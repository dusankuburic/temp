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
        if (error) {
          switch (error.status) {
            case 400:
              if (error.error?.errors) {
                const modalStateErrors = [];
                for (const key in error.error.errors) {
                  if (error.error.errors[key]) {
                    modalStateErrors.push(error.error.errors[key]);
                  }
                }
                this.alertify.error(modalStateErrors.flat().join('\n'));
              } else if (typeof error.error === 'object') {
                this.alertify.error('Bad Request');
              } else {
                this.alertify.error(error.error);
              }
              break;

            case 401:
              this.alertify.error('Unauthorized');
              this.router.navigate(['/login']);
              break;

            case 403:
              this.alertify.error('You do not have permission to access this resource');
              break;

            case 404:
              this.router.navigateByUrl('/not-found');
              break;

            case 500:
              this.router.navigateByUrl('/server-error');
              break;

            case 0:
              this.alertify.error('Network error - unable to connect to server');
              break;

            default:
              this.alertify.error('An unexpected error occurred');
              console.error('HTTP Error:', error);
              break;
          }
        }
        return throwError(() => error);
      })
    );
  }
}
