/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T22:21:05
 * Last Updated: 2025-12-23T02:28:41
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService, LoginRequest } from '../../../application/services/auth';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { LangPicker } from '../../lang-picker/lang-picker';
import { ZardIconComponent } from '../../../shared/components/icon/icon.component';
import { ZButtonComponent } from '../../../shared/components/button/button.component';
import { ZInputDirective } from '../../../shared/components/input/input.directive';
import { ZLabelComponent } from '../../../shared/components/label/label.component';
import {
  ZAlertComponent,
  ZAlertTitleComponent,
  ZAlertDescriptionComponent,
} from '../../../shared/components/alert/alert.component';
import { ZardCheckboxComponent } from '../../../shared/components/checkbox/checkbox.component';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  imports: [
    FormsModule,
    RouterLink,
    TranslatePipe,
    LangPicker,
    ZardIconComponent,
    ZButtonComponent,
    ZInputDirective,
    ZLabelComponent,
    ZAlertComponent,
    ZAlertTitleComponent,
    ZAlertDescriptionComponent,
    ZardCheckboxComponent,
  ],
})
export class Login implements OnInit, AfterViewInit {
  @ViewChild('loginForm') loginForm!: NgForm;
  @ViewChild('passwordInput') passwordInput!: ElementRef<HTMLInputElement>;

  isLoading = false;
  errorMessage = '';
  showPassword = false;
  rememberMe = false;

  credentials: LoginRequest = {
    email: '',
    password: '',
  };

  private authService = inject(AuthService);
  private translate = inject(TranslateService);
  private router = inject(Router);

  ngOnInit(): void {
    // Load remembered email if available
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      this.credentials.email = rememberedEmail;
      this.rememberMe = true;
    }

    // Redirect if already authenticated (but not while still validating tokens)
    this.authService.authState.subscribe((state) => {
      // Only redirect if authenticated and not loading (token validation complete)
      if (state.isAuthenticated && !state.isLoading && state.user) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  ngAfterViewInit(): void {
    // Auto-focus on email field if empty, otherwise on password field
    setTimeout(() => {
      if (!this.credentials.email) {
        const emailInput = document.getElementById('email') as HTMLInputElement;
        emailInput?.focus();
      }
    }, 100);
  }

  async onLogin(): Promise<void> {
    console.log('onLogin called', {
      email: this.credentials.email,
      password: this.credentials.password,
      formValid: this.loginForm?.valid,
    });

    // Mark all fields as touched to show validation errors
    if (this.loginForm) {
      Object.keys(this.loginForm.controls).forEach((key) => {
        const control = this.loginForm.controls[key];
        control.markAsTouched();
      });
    }

    if (!this.credentials.email || !this.credentials.password) {
      this.errorMessage = this.translate.instant('auth.requiredFields');
      return;
    }

    // Additional email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.credentials.email)) {
      this.errorMessage = this.translate.instant('auth.emailInvalid');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      console.log('Attempting login with:', { ...this.credentials, rememberMe: this.rememberMe });
      await this.authService.login({
        ...this.credentials,
        rememberMe: this.rememberMe,
      });

      console.log('Login successful');
      // Handle remember me functionality
      if (this.rememberMe) {
        localStorage.setItem('rememberedEmail', this.credentials.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      this.router.navigate(['/dashboard']);
    } catch (error: unknown) {
      console.error('Login error:', error);
      this.errorMessage = (error as Error)?.message || this.translate.instant('auth.loginFailed');
    } finally {
      this.isLoading = false;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  get welcomeMessage(): string {
    return this.translate.instant('app.welcome');
  }
}
