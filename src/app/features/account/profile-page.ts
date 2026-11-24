import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MembersApi } from '../../core/api/members-api';
import { Member } from '../../core/api/models';
import { Notifier } from '../../core/notifications/notifier';

@Component({
  selector: 'app-profile-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class ProfilePage implements OnInit {
  private readonly membersApi = inject(MembersApi);
  private readonly notifier = inject(Notifier);

  protected readonly member = signal<Member | null>(null);
  protected readonly saving = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.maxLength(20)]],
    birthDate: ['', Validators.required],
  });

  ngOnInit(): void {
    this.membersApi.me().subscribe({
      next: (member) => this.load(member),
      error: (error: unknown) => this.notifier.error(error),
    });
  }

  protected save(): void {
    const member = this.member();

    if (!member || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.membersApi.update(member.id, this.form.getRawValue()).subscribe({
      next: (updated) => {
        this.load(updated);
        this.saving.set(false);
        this.notifier.success('Profile updated.');
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notifier.error(error);
      },
    });
  }

  private load(member: Member): void {
    this.member.set(member);
    this.form.setValue({
      name: member.name,
      email: member.email,
      phone: member.phone,
      birthDate: member.birthDate.slice(0, 10),
    });
  }
}
