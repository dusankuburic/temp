import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt";
import { Observable } from "rxjs";

@Injectable()
export class AddAuthHeaderInterceptor implements HttpInterceptor {
    constructor(private jwtHelper: JwtHelperService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = localStorage.getItem('token');

        if (!token || this.jwtHelper.isTokenExpired(token)) {
            return next.handle(req);
        }

        const authorized = req.clone({
            setHeaders: { 'Authorization': `Bearer ${token}` }
        });

        return next.handle(authorized);
    }
}
