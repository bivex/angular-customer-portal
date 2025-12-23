/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T13:31:53
 * Last Updated: 2025-12-23T02:28:40
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeShowcase } from './theme-showcase';

describe('ThemeShowcase', () => {
  let component: ThemeShowcase;
  let fixture: ComponentFixture<ThemeShowcase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeShowcase],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeShowcase);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
