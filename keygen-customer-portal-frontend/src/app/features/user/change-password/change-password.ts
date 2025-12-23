/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T22:30:00
 * Last Updated: 2025-12-20T22:06:01
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../application/services/auth';
import { ZButtonComponent } from '../../../shared/components/button/button.component';
import { ZInputDirective } from '../../../shared/components/input/input.directive';
import { ZardIconComponent } from '../../../shared/components/icon/icon.component';
import {
  ZCardComponent,
  ZCardHeaderComponent,
  ZCardTitleComponent,
  ZCardContentComponent,
  ZCardDescriptionComponent,
} from '../../../shared/components/card/card.component';
import { ZConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ZAvatarComponent } from '../../../shared/components/avatar/avatar.component';
import {
  ZAlertComponent,
  ZAlertTitleComponent,
  ZAlertDescriptionComponent,
} from '../../../shared/components/alert/alert.component';
import { ZButtonGroupComponent } from '../../../shared/components/button-group/button-group.component';

interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Custom validator for password confirmation
function passwordMatchValidator(control: AbstractControl): Record<string, any> | null {
  const newPassword = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');

  if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  templateUrl: './change-password.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ZButtonComponent,
    ZInputDirective,
    ZardIconComponent,
    ZCardComponent,
    ZCardHeaderComponent,
    ZCardTitleComponent,
    ZCardContentComponent,
    ZCardDescriptionComponent,
    ZConfirmModalComponent,
    ZAvatarComponent,
    ZAlertComponent,
    ZAlertTitleComponent,
    ZAlertDescriptionComponent,
    ZButtonGroupComponent,
  ],
})
export class ChangePasswordComponent implements OnInit {
  // Reactive form with proper initialization
  changePasswordForm = inject(FormBuilder).group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator }
  );

  // Reactive state using signals
  isLoading = signal(false);
  isChanging = signal(false);
  isSubmitted = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  showConfirmModal = signal(false);

  // Computed signals
  isFormDisabled = computed(() => this.isChanging() || !this.changePasswordForm.valid);

  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    // Redirect if not authenticated
    this.authService.authState.subscribe((state) => {
      if (!state.isAuthenticated && !state.isLoading) {
        this.router.navigate(['/login']);
      }
    });
  }

  async onChangePassword(): Promise<void> {
    this.isSubmitted.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.changePasswordForm.valid) {
      this.showConfirmModal.set(true);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.changePasswordForm.controls).forEach((key) => {
        this.changePasswordForm.get(key)?.markAsTouched();
      });
    }
  }

  async confirmChangePassword(): Promise<void> {
    this.showConfirmModal.set(false);
    this.isChanging.set(true);

    try {
      const formValue = this.changePasswordForm.value;
      const formData: ChangePasswordFormData = {
        currentPassword: formValue.currentPassword || '',
        newPassword: formValue.newPassword || '',
        confirmPassword: formValue.confirmPassword || '',
      };

      await this.authService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      this.successMessage.set('Password changed successfully');
      this.resetForm();

      // Optional: redirect to profile or show success message
      setTimeout(() => {
        this.router.navigate(['/user/profile']);
      }, 2000);
    } catch (error: unknown) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Failed to change password. Please try again.'
      );
    } finally {
      this.isChanging.set(false);
    }
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    switch (field) {
      case 'current':
        this.showCurrentPassword.update((current) => !current);
        break;
      case 'new':
        this.showNewPassword.update((current) => !current);
        break;
      case 'confirm':
        this.showConfirmPassword.update((current) => !current);
        break;
    }
  }

  onCancel(): void {
    const hasChanges = !this.changePasswordForm.pristine;

    if (hasChanges) {
      this.showConfirmModal.set(true);
    } else {
      this.router.navigate(['/user/profile']);
    }
  }

  confirmCancel(): void {
    this.showConfirmModal.set(false);
    this.router.navigate(['/user/profile']);
  }

  private resetForm(): void {
    this.changePasswordForm.reset();
    this.isSubmitted.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
