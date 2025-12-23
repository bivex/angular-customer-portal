/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-21T22:30:00
 * Last Updated: 2025-12-21T22:06:01
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

// Пример использования компонента ChangePasswordComponent
// Этот файл демонстрирует, как правильно интегрировать компонент в приложение

import { Component } from '@angular/core';
import { ChangePasswordComponent } from './change-password';

/**
 * Пример родительского компонента, который использует ChangePasswordComponent
 *
 * В реальном приложении этот компонент может быть частью роутинга или
 * отображаться в модальном окне.
 */
@Component({
  selector: 'app-user-settings',
  standalone: true,
  template: `
    <div class="container mx-auto p-6">
      <nav class="mb-6">
        <h1 class="text-2xl font-bold mb-4">User Settings</h1>
        <div class="flex gap-4 mb-6">
          <a routerLink="/user/profile" class="text-blue-600 hover:underline">Profile</a>
          <a routerLink="/user/change-password" class="text-blue-600 hover:underline font-semibold"
            >Change Password</a
          >
          <a routerLink="/user/security" class="text-blue-600 hover:underline">Security</a>
        </div>
      </nav>

      <!-- Основной контент - компонент смены пароля -->
      <app-change-password></app-change-password>
    </div>
  `,
  imports: [ChangePasswordComponent],
})
export class UserSettingsComponent {
  // Этот компонент может содержать дополнительную логику для:
  // - Проверки аутентификации
  // - Управления состоянием пользователя
  // - Обработки навигации
  // - Управления breadcrumbs
}

/**
 * Пример использования в роутинге приложения
 *
 * В app.routes.ts:
 *
 * export const routes: Routes = [
 *   {
 *     path: 'user',
 *     children: [
 *       { path: 'profile', component: ProfileComponent },
 *       { path: 'change-password', component: ChangePasswordComponent },
 *       { path: 'settings', component: UserSettingsComponent },
 *     ],
 *     canActivate: [AuthGuard], // Защита маршрутов
 *   }
 * ];
 */

/**
 * Пример использования с guards для защиты
 *
 * // auth.guard.ts
 * @Injectable({ providedIn: 'root' })
 * export class AuthGuard implements CanActivate {
 *   constructor(private authService: AuthService, private router: Router) {}
 *
 *   canActivate(): boolean {
 *     const isAuthenticated = this.authService.isAuthenticated();
 *     if (!isAuthenticated) {
 *       this.router.navigate(['/login']);
 *       return false;
 *     }
 *     return true;
 *   }
 * }
 */

/**
 * Пример сервиса аутентификации
 *
 * // auth.service.ts
 * @Injectable({ providedIn: 'root' })
 * export class AuthService {
 *   private readonly http = inject(HttpClient);
 *   private readonly router = inject(Router);
 *
 *   readonly authState = signal<AuthState>({
 *     isAuthenticated: false,
 *     isLoading: true,
 *     user: null
 *   });
 *
 *   async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
 *     try {
 *       await this.http.post('/api/auth/change-password', data).toPromise();
 *       // Обновить состояние пользователя или токены при необходимости
 *     } catch (error) {
 *       throw new Error('Failed to change password');
 *     }
 *   }
 *
 *   logout(): void {
 *     // Очистка токенов, состояния и перенаправление
 *     this.router.navigate(['/login']);
 *   }
 * }
 */
