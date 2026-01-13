import { Component, OnInit } from '@angular/core';
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs';
import { Group } from 'src/app/core/models/group';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { GroupService } from 'src/app/core/services/group.service';
import { GroupValidators } from '../group-validators';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';

@Component({
    selector: 'app-group-edit',
    templateUrl: './group-edit.component.html',
    styleUrl: './group-edit.component.scss',
    standalone: false
})
export class GroupEditComponent extends DestroyableComponent implements OnInit {
  editGroupForm!: FormGroup;
  group!: Group;
  organizationId!: number;

  name = new FormControl('',[
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(60)
  ]);

  constructor(
    private groupService: GroupService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private alertify: AlertifyService,
    public validators: GroupValidators) {
      super();
    }

  ngOnInit(): void {
    this.editGroupForm = this.fb.group({
      name: this.name
    });

    this.organizationId = parseInt(this.route.snapshot.paramMap.get('organizationId') ?? '0');

    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.group = data['group'];
      this.setupForm(this.group);
    });
  }

  setupForm(group: Group): void {
    if (this.editGroupForm)
      this.editGroupForm.reset();

      this.name.addAsyncValidators(this.validators.validateNameNotTaken(this.organizationId, group.name));

      this.editGroupForm.patchValue({
        name: group.name
      });
  }

  update(): void {
    const groupForm = { ...this.editGroupForm.value };
    this.group.name = groupForm.name;
    this.groupService.updateGroup(this.group.id, this.group).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.alertify.success('Successfully updated');
      },
      error: () => {
        this.alertify.error('Unable to edit group');
      }
    });
  }

}
