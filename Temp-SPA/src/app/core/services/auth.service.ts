import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from 'src/environments/environment';
import { User } from '../models/user';
import { JwtPayload } from '../models/jwt-payload';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  baseUrl = environment.apiUrl;
  jwtHelper = new JwtHelperService();
  decodedToken: JwtPayload | null = null;
  currentUser!: User;

constructor(private http: HttpClient) { }

login(model: LoginRequest): Observable<void> {
  return this.http.post<LoginResponse>(this.baseUrl + 'accounts/login', model)
  .pipe(
    map((response: LoginResponse) => {
      const user = response;
      if (user) {
        localStorage.setItem('token', user.token);
        localStorage.setItem('user', JSON.stringify(user.user));
        this.decodedToken = this.jwtHelper.decodeToken(user.token) as JwtPayload;
        this.currentUser = user.user;
      }
    })
  );
}

registerUser(user: User): Observable<unknown> {
  return this.http.post(this.baseUrl + 'accounts/register', user);
}


loggedIn(): boolean {
  const token = localStorage.getItem('token');
  return !this.jwtHelper.isTokenExpired(token ?? null);
}

logout(): Observable<void> {
  return this.http.post<void>(this.baseUrl + 'accounts/logout', {});
}

clearStorage(): void {
  localStorage.removeItem('token');
  this.decodedToken = null;
  localStorage.removeItem('user');
  this.currentUser = null as unknown as User;
}

}
