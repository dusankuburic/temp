import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt";
import { Observable } from "rxjs";

@Injectable()
export class AddAuthHeaderInterceptor implements HttpInterceptor {
    jwtHelper = new JwtHelperService();
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        let token = localStorage.getItem('token');
        let authHeader = '';
        if (!this.jwtHelper.isTokenExpired(token ?? null))
            authHeader = `Bearer ${token}`

        const authorized: HttpRequest<any> = req.clone({
            setHeaders: {'Authorization': authHeader}
        });

        return next.handle(authorized);
    }
}
