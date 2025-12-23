/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T22:00:00
 * Last Updated: 2025-12-21T21:45:55
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService, User } from '../../../application/services/auth';
import { ZButtonComponent } from '../../../shared/components/button/button.component';
import { ZInputDirective } from '../../../shared/components/input/input.directive';
import { ZLabelComponent } from '../../../shared/components/label/label.component';
import { ZardIconComponent } from '../../../shared/components/icon/icon.component';
import { ZardFormModule } from '../../../shared/components/form/form.module';
import { ZAvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { LayoutModule } from '../../../shared/components/layout/layout.module';
import { ZConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

interface ProfileFormData {
  name: string;
  email: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    ZButtonComponent,
    ZInputDirective,
    ZardIconComponent,
    ZardFormModule,
    LayoutModule,
    ZConfirmModalComponent,
    ZAvatarComponent,
  ],
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  isLoading = false;
  isSaving = false;
  isSubmitted = false;
  errorMessage = '';
  successMessage = '';
  showConfirmModal = false;

  protected readonly idFullName = 'fullName';
  protected readonly idEmail = 'email';

  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  get user(): User | null {
    return this.authService.user;
  }

  constructor() {
    this.profileForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    // Load current user data
    this.loadUserData();

    // Redirect if not authenticated
    this.authService.authState.subscribe((state) => {
      if (!state.isAuthenticated && !state.isLoading) {
        this.router.navigate(['/login']);
      }
    });
  }

  private loadUserData(): void {
    if (this.user) {
      this.profileForm.patchValue({
        name: this.user.name,
        email: this.user.email,
      });
    }
  }

  async onSave(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitted = true;

    if (this.profileForm.valid && this.user) {
      const formData: ProfileFormData = this.profileForm.value;
      const hasChanges = formData.name !== this.user.name || formData.email !== this.user.email;

      console.log('Has changes:', hasChanges);
      console.log('User data:', { name: this.user.name, email: this.user.email });
      console.log('Form data:', formData);

      if (!hasChanges) {
        this.successMessage = 'No changes to save';
        return;
      }

      this.showConfirmModal = true;
    } else {
      console.log('Form is not valid or user is null');
      if (!this.profileForm.valid) {
        console.log('Form errors:', this.profileForm.errors);
        Object.keys(this.profileForm.controls).forEach((key) => {
          const control = this.profileForm.get(key);
          if (control?.invalid) {
            console.log(`${key} errors:`, control.errors);
          }
        });
      }
    }
  }

  async confirmSave(): Promise<void> {
    this.showConfirmModal = false;
    this.isSaving = true;

    // Disable form controls during save
    this.profileForm.disable();

    try {
      const formData: ProfileFormData = this.profileForm.value;

      await this.authService.updateProfile({
        name: formData.name,
        email: formData.email,
      });

      this.successMessage = 'Profile updated successfully';
      await this.authService.refreshSession();
    } catch (error: unknown) {
      this.errorMessage =
        error instanceof Error ? error.message : 'Failed to update profile. Please try again.';
    } finally {
      this.isSaving = false;
      // Re-enable form controls
      this.profileForm.enable();
    }
  }

  onCancel(): void {
    const formData: ProfileFormData = this.profileForm.value;
    const hasChanges = formData.name !== this.user?.name || formData.email !== this.user?.email;

    if (hasChanges) {
      this.showConfirmModal = true;
    } else {
      this.resetForm();
    }
  }

  confirmCancel(): void {
    this.showConfirmModal = false;
    this.resetForm();
  }

  private resetForm(): void {
    this.profileForm.patchValue({
      name: this.user?.name,
      email: this.user?.email,
    });
    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitted = false;
  }
}
