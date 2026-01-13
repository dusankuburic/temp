import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { takeUntil } from 'rxjs';
import { Application } from "src/app/core/models/application";
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';


@Component({
    selector: 'app-application-moderator',
    templateUrl: './application-user.component.html',
    standalone: false
})
export class ApplicationModeratorComponent extends DestroyableComponent implements OnInit {
    application!: Application;

    constructor(private route: ActivatedRoute) {
        super();
    }

    ngOnInit(): void {
        this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
            this.application = data['application'];
        });
    }
}
