import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter, takeUntil } from 'rxjs';
import { AlertifyService } from '../core/services/alertify.service';
import { AuthService } from '../core/services/auth.service';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { DestroyableComponent } from '../core/base/destroyable.component';
import { User } from '../core/models/user';
import { JwtPayload } from '../core/models/jwt-payload';

@Component({
    selector: 'app-nav',
    templateUrl: './nav.component.html',
    styleUrls: ['./nav.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
 export class NavComponent extends DestroyableComponent implements OnInit, OnDestroy {
   signOutIcon = faSignOutAlt
   isMenuOpen = false;
   isUserMenuOpen = false;
   isScrolled = false;
   private removeDocumentClickListener?: () => void;
   private removeScrollListener?: () => void;

   constructor(
     public authService: AuthService,
     private alertify: AlertifyService,
     private router: Router,
     private renderer: Renderer2,
     @Inject(DOCUMENT) private document: Document,
     private cdr: ChangeDetectorRef) {
     super();
   }

   ngOnInit(): void {
     
     this.removeDocumentClickListener = this.renderer.listen(this.document, 'click', () => {
       if (this.isUserMenuOpen) {
         this.isUserMenuOpen = false;
         this.cdr.markForCheck();
       }
     });

     
     this.removeScrollListener = this.renderer.listen(this.document, 'scroll', () => {
       this.onWindowScroll();
     });

     
     this.onWindowScroll();

     this.router.events
       .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), takeUntil(this.destroy$))
       .subscribe(() => {
         this.isUserMenuOpen = false;
         if (this.isMobile()) {
           this.isMenuOpen = false;
           this.applySidebarState();
         }
         this.cdr.markForCheck();
       });
   }

   private onWindowScroll(): void {
     const scrollPosition = typeof window !== 'undefined' ? window.pageYOffset || document.documentElement.scrollTop : 0;
     const newIsScrolled = scrollPosition > 10;
     if (this.isScrolled !== newIsScrolled) {
       this.isScrolled = newIsScrolled;
       this.cdr.markForCheck();
     }
   }

  ngOnDestroy(): void {
    this.removeDocumentClickListener?.();
    this.removeScrollListener?.();
    super.ngOnDestroy();
  }


  loggedIn(): boolean {
    return this.authService.loggedIn();
  }

  toggleSidebar(): void {
    this.isMenuOpen = !this.isMenuOpen;
    this.applySidebarState();
  }

  logout(): void {
    this.isUserMenuOpen = false;
    this.authService.logout()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.authService.clearStorage();
          this.alertify.message('logged out');
          this.router.navigate(['']);
        },
        error: () => {
          this.authService.clearStorage();
          this.alertify.error('Unable to logout');
        }
      });
  }

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }


  private applySidebarState(): void {
    const wrapper = this.document.getElementById('wrapper');
    if (!wrapper) {
      return;
    }

    if (this.isMenuOpen) {
      this.renderer.addClass(wrapper, 'toggled');
    } else {
      this.renderer.removeClass(wrapper, 'toggled');
    }
  }

  get currentUser(): User {
    return this.authService.currentUser;
  }

  get decodedToken(): JwtPayload | null {
      return this.authService.decodedToken;
  }

  private isMobile(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  }
}
