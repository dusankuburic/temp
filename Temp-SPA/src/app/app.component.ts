import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AuthService } from './core/services/auth.service';
import { ModalFixService } from './core/services/modal-fix.service';
import { User } from './core/models/user';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class AppComponent implements OnInit {
  jwtHelper = new JwtHelperService();

  constructor(
    private authService: AuthService,
    private modalFixService: ModalFixService
  ) {}

  ngOnInit(): void {
    this.restoreAuthState();
  }

  private restoreAuthState(): void {
    try {
      const token = localStorage.getItem('token');

      if (token && !this.jwtHelper.isTokenExpired(token)) {
        this.authService.decodedToken = this.jwtHelper.decodeToken(token);
      } else if (token) {
        // Token exists but is expired, clear it
        this.authService.clearStorage();
        return;
      }

      const userStr = localStorage.getItem('user');
      if (userStr) {
        const parsedUser = this.safeParseUser(userStr);
        if (parsedUser && this.isValidUser(parsedUser)) {
          this.authService.currentUser = parsedUser;
        } else {
          // Invalid user data, clear storage
          this.authService.clearStorage();
        }
      }
    } catch (error) {
      console.error('Failed to restore auth state:', error);
      this.authService.clearStorage();
    }
  }

  private safeParseUser(userStr: string): User | null {
    try {
      const parsed = JSON.parse(userStr);
      return parsed;
    } catch {
      return null;
    }
  }

  private isValidUser(user: any): user is User {
    return (
      user &&
      typeof user === 'object' &&
      typeof user.id === 'number' &&
      typeof user.username === 'string' &&
      (user.password === undefined || typeof user.password === 'string') &&
      (user.profilePictureUrl === undefined || typeof user.profilePictureUrl === 'string')
    );
  }

  get isLoggedIn(): boolean {
    return this.authService.loggedIn();
  }
}
