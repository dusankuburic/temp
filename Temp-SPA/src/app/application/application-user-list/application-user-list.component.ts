import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs';
import { faComment, faEye } from '@fortawesome/free-solid-svg-icons';
import { UserListApplication } from 'src/app/core/models/application';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';


@Component({
    selector: 'app-application-user-list',
    templateUrl: './application-user-list.component.html',
    styleUrl: './application-user-list.component.scss',
    standalone: false
})
export class ApplicationUserListComponent extends DestroyableComponent implements OnInit {
  commentIcon = faComment
  eyeIcon = faEye;

  applications!: UserListApplication[];

  constructor(private route: ActivatedRoute) {
    super();
  }

  ngOnInit(): void {
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.applications = data['applications'];
    });
  }

}
