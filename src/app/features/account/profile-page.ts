import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AccountApi } from '../../core/api/library-api';
import { MembersApi } from '../../core/api/members-api';
import { I18n } from '../../core/i18n/i18n.service';
import { LocalDatePipe, TranslatePipe } from '../../core/i18n/pipes';
import { Member } from '../../core/api/models';
import { Notifier } from '../../core/notifications/notifier';

@Component({
  selector: 'app-profile-page',
  imports: [
    LocalDatePipe,
    TranslatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class ProfilePage implements OnInit {
  private readonly membersApi = inject(MembersApi);
  private readonly notifier = inject(Notifier);
  private readonly i18n = inject(I18n);
  private readonly accountApi = inject(AccountApi);

  protected readonly member = signal<Member | null>(null);
  protected readonly saving = signal(false);
  protected readonly resending = signal(false);
  protected readonly changing = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.maxLength(20)]],
    birthDate: ['', Validators.required],
  });

  protected readonly passwordForm = inject(FormBuilder).nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
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
        this.notifier.success(this.i18n.t('Profile updated.'));
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notifier.error(error);
      },
    });
  }

  protected resend(): void {
    this.resending.set(true);
    this.accountApi.resendConfirmation().subscribe({
      next: () => {
        this.resending.set(false);
        this.notifier.success(this.i18n.t('We sent a new confirmation link to your email.'));
      },
      error: (error: unknown) => {
        this.resending.set(false);
        this.notifier.error(error);
      },
    });
  }

  protected changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.changing.set(true);
    this.accountApi.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.changing.set(false);
        this.passwordForm.reset();
        this.notifier.success(this.i18n.t('Your password was changed.'));
      },
      error: (error: unknown) => {
        this.changing.set(false);
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
