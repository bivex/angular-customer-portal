/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T23:02:00
 * Last Updated: 2025-12-20T22:06:00
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../application/services/auth';
import { TranslatePipe } from '@ngx-translate/core';
import { LangPicker } from '../../lang-picker/lang-picker';
import { GridComponent } from '../../../shared/grid/grid.component';
import { ZButtonComponent } from '../../../shared/components/button/button.component';
import { ZInputDirective } from '../../../shared/components/input/input.directive';
import { ZLabelComponent } from '../../../shared/components/label/label.component';
import { ZardIconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    TranslatePipe,
    LangPicker,
    GridComponent,
    ZButtonComponent,
    ZInputDirective,
    ZLabelComponent,
    ZardIconComponent,
  ],
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage = '';

  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  async onRegister() {
    this.errorMessage = '';
    if (this.registerForm.valid) {
      try {
        const { name, email, password } = this.registerForm.value;
        await this.authService.register(name, email, password);
        await this.router.navigate(['/dashboard']); // Redirect to dashboard after successful registration
      } catch (error: unknown) {
        this.errorMessage =
          error instanceof Error ? error.message : 'Registration failed. Please try again.';
      }
    }
  }
}
