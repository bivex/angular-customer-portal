/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T07:56:00
 * Last Updated: 2025-12-23T02:28:36
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Injectable } from '@angular/core';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { Observable, map } from 'rxjs';

export type GridBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Injectable({
  providedIn: 'root',
})
export class GridService {
  constructor(private breakpointObserver: BreakpointObserver) {}

  /**
   * Get current breakpoint
   */
  getCurrentBreakpoint(): Observable<GridBreakpoint> {
    return this.breakpointObserver
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
        Breakpoints.XLarge,
      ])
      .pipe(
        map((state: BreakpointState) => {
          if (state.breakpoints[Breakpoints.XSmall]) return 'xs';
          if (state.breakpoints[Breakpoints.Small]) return 'sm';
          if (state.breakpoints[Breakpoints.Medium]) return 'md';
          if (state.breakpoints[Breakpoints.Large]) return 'lg';
          if (state.breakpoints[Breakpoints.XLarge]) return 'xl';
          return 'md'; // default
        })
      );
  }

  /**
   * Check if current breakpoint is mobile
   */
  isMobile(): Observable<boolean> {
    return this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(map((state) => state.matches));
  }

  /**
   * Check if current breakpoint is tablet or larger
   */
  isTabletOrLarger(): Observable<boolean> {
    return this.breakpointObserver
      .observe([Breakpoints.Medium, Breakpoints.Large, Breakpoints.XLarge])
      .pipe(map((state) => state.matches));
  }

  /**
   * Check if current breakpoint is desktop
   */
  isDesktop(): Observable<boolean> {
    return this.breakpointObserver
      .observe([Breakpoints.Large, Breakpoints.XLarge])
      .pipe(map((state) => state.matches));
  }

  /**
   * Get optimal grid columns for current breakpoint
   */
  getOptimalColumns(): Observable<number> {
    return this.getCurrentBreakpoint().pipe(
      map((breakpoint) => {
        switch (breakpoint) {
          case 'xs':
            return 1;
          case 'sm':
            return 2;
          case 'md':
            return 3;
          case 'lg':
            return 4;
          case 'xl':
            return 6;
          default:
            return 3;
        }
      })
    );
  }
}
