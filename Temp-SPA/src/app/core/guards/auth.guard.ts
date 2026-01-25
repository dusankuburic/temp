import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AlertifyService } from '../services/alertify.service';
import { AuthService } from '../services/auth.service';
import { UserRoles } from '../constants/app.constants';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const alertify = inject(AlertifyService);

  if (authService.loggedIn() && authService.decodedToken?.role === UserRoles.ADMIN) {
    return true;
  }

  alertify.error('Access denied. Admin privileges required.');
  router.navigate(['/home']);
  return false;
};
