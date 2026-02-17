import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { faAddressBook, faAngleRight, faBriefcase, faClipboard, faFileAlt, faHotel, faIndustry, faUsers } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class SidebarComponent implements OnInit, OnDestroy {
  arrowIcon = faAngleRight
  menuSections: MenuSection[] = [];
  activeSection: string | null = null;
  user: any;
  isMobile = false;
  private mediaQuery?: MediaQueryList;
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const userJson = localStorage.getItem('user');
    this.user = userJson ? JSON.parse(userJson) : null;
    const role = this.authService.decodedToken?.role ?? '';

    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQuery = window.matchMedia('(max-width: 767px)');
      this.isMobile = this.mediaQuery.matches;
      this.mediaQuery.addEventListener('change', this.handleMediaChange);
    }

    this.menuSections = this.buildMenu(role);
    this.setActiveSectionFromUrl(this.router.url);

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe(event => {
        this.setActiveSectionFromUrl(event.urlAfterRedirects);
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.handleMediaChange);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSection(sectionKey: string): void {
    this.activeSection = this.activeSection === sectionKey ? null : sectionKey;
  }

  isSectionOpen(sectionKey: string): boolean {
    return this.activeSection === sectionKey;
  }

  loggedIn(): boolean {
    return this.authService.loggedIn();
  }

  handleLinkClick(): void {
    if (this.isMobile) {
      this.activeSection = null;
    }
  }

  private handleMediaChange = (event: MediaQueryListEvent): void => {
    this.isMobile = event.matches;
    if (!this.isMobile) {
      this.activeSection = null;
    }
    this.cdr.markForCheck();
  };

  private buildMenu(role: string): MenuSection[] {
    const baseSections: Record<string, MenuSection[]> = {
      Admin: [
        {
          key: 'employee',
          label: 'Employee',
          icon: faAddressBook,
          links: [
            { label: 'Employees', commands: ['/employees'] },
            { label: 'Create Employee', commands: ['/employees/create'] }
          ]
        },
        {
          key: 'workplace',
          label: 'Workplace',
          icon: faBriefcase,
          links: [
            { label: 'Workplaces', commands: ['/workplaces'] },
            { label: 'Create Workplace', commands: ['/workplaces/create'] }
          ]
        },
        {
          key: 'employmentStatus',
          label: 'Employment Status',
          icon: faClipboard,
          links: [
            { label: 'Statuses', commands: ['/employment-statuses'] },
            { label: 'Create Status', commands: ['/employment-statuses/create'] }
          ]
        },
        {
          key: 'engagement',
          label: 'Engagement',
          icon: faIndustry,
          links: [
            { label: 'With Engagements', commands: ['/engagements/with-employee'] },
            { label: 'Without Engagements', commands: ['/engagements/without-employee'] }
          ]
        },
        {
          key: 'organization',
          label: 'Organization',
          icon: faHotel,
          links: [
            { label: 'Organizations', commands: ['/organizations'] },
            { label: 'Create Organization', commands: ['/organizations/create'] }
          ]
        }
      ],
      User: [
        {
          key: 'application',
          label: 'Application',
          icon: faFileAlt,
          links: this.user
            ? [
                { label: 'Applications', commands: ['/applications/list', this.user.id] },
                { label: 'Create Application', commands: ['/applications/create', this.user.id] }
              ]
            : []
        },
        {
          key: 'engagementUser',
          label: 'Engagement',
          icon: faIndustry,
          links: this.user
            ? [{ label: 'Engagements', commands: ['/engagements/user-list', this.user.id] }]
            : []
        }
      ],
      Moderator: [
        {
          key: 'groups',
          label: 'Groups',
          icon: faUsers,
          links: this.user
            ? [{ label: 'Assigned groups', commands: ['/groups', this.user.id, 'assigned-groups'] }]
            : []
        }
      ]
    };

    return baseSections[role] ?? [];
  }

  private setActiveSectionFromUrl(url: string): void {
    for (const section of this.menuSections) {
      for (const link of section.links) {
        const tree = this.router.createUrlTree(link.commands);
        const path = this.router.serializeUrl(tree);
        if (url.startsWith(path)) {
          this.activeSection = section.key;
          return;
        }
      }
    }
    this.activeSection = null;
  }
}

interface MenuLink {
  label: string;
  commands: any[];
}

interface MenuSection {
  key: string;
  label: string;
  icon: IconDefinition;
  links: MenuLink[];
}
