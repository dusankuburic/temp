import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { JwtModule } from '@auth0/angular-jwt';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { OverlayContainer, FullscreenOverlayContainer } from '@angular/cdk/overlay';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TabsModule } from 'ngx-bootstrap/tabs';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavComponent } from './nav/nav.component';
import { HomeComponent } from './home/home.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { SharedModule } from './shared/shared.module';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AddAuthHeaderInterceptor } from './core/interceptors/auth-interceptor.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { UserModule } from './user/user.module';
import { ErrorsModule } from './errors/errors.module';

export function tokenGetter(): any {
  return localStorage.getItem('token');
}

@NgModule({ declarations: [
        AppComponent,
        NavComponent,
        HomeComponent,
        SidebarComponent,
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        UserModule,
        ErrorsModule,
        SharedModule,
        FormsModule,
        AppRoutingModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        BsDropdownModule.forRoot(),
        JwtModule.forRoot({
            config: {
                tokenGetter: tokenGetter,
                allowedDomains: ['localhost:5000'],
                disallowedRoutes: ['localhost:5000/api/admins/register', 'localhost:5000/api/users/register']
            }
        }),
        TabsModule.forRoot(),
        FontAwesomeModule], providers: [
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: AddAuthHeaderInterceptor, multi: true },
        { provide: OverlayContainer, useClass: FullscreenOverlayContainer },
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
