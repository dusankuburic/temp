import { CommonModule } from "@angular/common";
import {  NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { PaginationModule } from "ngx-bootstrap/pagination";
import { TmpPaginationComponent } from "./components/tmp-pagination/tmp-pagination.component";
import { TmpInputComponent } from "./components/tmp-input/tmp-input.component";
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { PasswordValidator } from "./validators/password.validators";
import { TmpDatepickerComponent } from "./components/tmp-datepicker/tmp-datepicker.component";
import { ControlValueAccessorDirective } from "./components/control-value-accessor.directive";
import { TmpSelectComponent } from "./components/tmp-select/tmp-select.component";
import { TmpFileUploadComponent } from "./components/tmp-file-upload/tmp-file-upload.component";
import { TmpAvatarComponent } from "./components/tmp-avatar/tmp-avatar.component";
import { TmpButtonComponent } from "./components/tmp-button/tmp-button.component";
import { TmpCardComponent } from "./components/tmp-card/tmp-card.component";
import { TmpBadgeComponent } from "./components/tmp-badge/tmp-badge.component";
import { TmpModalComponent } from "./components/tmp-modal/tmp-modal.component";
import { TmpTableComponent } from "./components/tmp-table/tmp-table.component";
import { BsModalService } from "ngx-bootstrap/modal";
import { EmploymentStatusValidators } from "../employment-status/employment-status-validators";
import { WorkplaceValidators } from "../workplace/workplace-validators";
import { OrganizationValidators } from "../organization/organization-validators";
import { GroupValidators } from "../group/group-validators";
import { TeamValidators } from "../team/team-validators";

@NgModule({
    declarations: [
      ControlValueAccessorDirective,
      TmpPaginationComponent,
      TmpInputComponent,
      TmpDatepickerComponent,
      TmpSelectComponent,
      TmpFileUploadComponent,
      TmpAvatarComponent,
      TmpButtonComponent,
      TmpCardComponent,
      TmpBadgeComponent,
      TmpModalComponent,
      TmpTableComponent,
    ],
    imports: [
      MatDatepickerModule,
      MatNativeDateModule,
      MatInputModule,
      CommonModule,
      FormsModule,
      ReactiveFormsModule,
      PaginationModule,
      FontAwesomeModule
    ],
    exports: [
      CommonModule,
      FormsModule,
      ReactiveFormsModule,
      PaginationModule,
      FontAwesomeModule,
      TmpPaginationComponent,
      TmpInputComponent,
      TmpDatepickerComponent,
      TmpSelectComponent,
      TmpFileUploadComponent,
      TmpAvatarComponent,
      TmpButtonComponent,
      TmpCardComponent,
      TmpBadgeComponent,
      TmpModalComponent,
      TmpTableComponent
    ],
    providers: [
      PasswordValidator,
      EmploymentStatusValidators,
      OrganizationValidators,
      TeamValidators,
      GroupValidators,
      WorkplaceValidators,
      BsModalService,
    ]
  })
  export class SharedModule {}
