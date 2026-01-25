import { Component, OnInit } from '@angular/core';
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Workplace } from 'src/app/core/models/workplace';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { WorkplaceService } from 'src/app/core/services/workplace.service';
import { WorkplaceValidators } from '../workplace-validators';
import { takeUntil } from 'rxjs';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';

@Component({
    selector: 'app-workplace-edit',
    templateUrl: './workplace-edit.component.html',
    styleUrl: './workplace-edit.component.scss',
    standalone: false
})
export class WorkplaceEditComponent extends DestroyableComponent implements OnInit {
  editWorkplaceForm!: FormGroup;
  workplace!: Workplace;

  name = new FormControl('', [
    Validators.required, 
    Validators.minLength(3), 
    Validators.maxLength(60)]);

  constructor(
    private workplaceService: WorkplaceService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private alertify: AlertifyService,
    private validators: WorkplaceValidators) {
      super();
    }

  ngOnInit(): void {
    this.editWorkplaceForm = this.fb.group({
      name: this.name
    });

    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.workplace = data['workplace'];
      this.setupForm(this.workplace);
    });
  }

  setupForm(workplace: Workplace): void {
    if (this.editWorkplaceForm) 
      this.editWorkplaceForm.reset();
     
    this.name.addAsyncValidators(this.validators.validateNameNotTaken(workplace.name))

    this.editWorkplaceForm.patchValue({
      name: workplace.name
    });
  }

  update(): void {
    const workplaceForm = { ...this.editWorkplaceForm.value, id: this.workplace.id};
    this.workplaceService.updateWorkplace(workplaceForm).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.alertify.success('Successfully updated');
      },
      error: () => {
        this.alertify.error('Unable to edit workplace');
      }
    });
  }

}
