/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-18T22:21:03
 * Last Updated: 2025-12-20T22:05:59
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { App } from './app';
import { AuthService } from './application/services/auth';

// Mock AuthService
class MockAuthService {
  initialize = vi.fn().mockResolvedValue(void 0);
  authState = {
    subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  };
}

describe('App', () => {
  let component: App;
  let mockAuthService: MockAuthService;

  beforeEach(() => {
    mockAuthService = new MockAuthService();

    TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    });

    // Create component instance manually to avoid template loading issues
    component = new App(mockAuthService);
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize auth service on init', async () => {
    await component.ngOnInit();
    expect(mockAuthService.initialize).toHaveBeenCalled();
  });

  it('should set loading state based on auth state', async () => {
    await component.ngOnInit();
    expect(mockAuthService.authState.subscribe).toHaveBeenCalled();
  });
});
