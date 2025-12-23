/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T22:05:58
 * Last Updated: 2025-12-20T22:05:58
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Injectable, Injector, Type } from '@angular/core';
import { IDependencyInjectionTreeDumper } from '../../domain/interfaces/architecture-dumper.interface';

@Injectable({
  providedIn: 'root',
})
export class DependencyInjectionTreeDumperService implements IDependencyInjectionTreeDumper {
  constructor(private injector: Injector) {}

  /**
   * Dump dependency injection tree
   */
  dumpDependencyInjectionTree(): void {
    console.group('💉 Dependency Injection Tree');

    try {
      console.log('🔍 Injector Hierarchy:');
      this.analyzeInjector(this.injector, 0);
    } catch (error) {
      console.error('Error dumping DI tree:', error);
    }

    console.groupEnd();
  }

  /**
   * Analyze injector hierarchy
   */
  private analyzeInjector(injector: Injector, level: number): void {
    const indent = '  '.repeat(level);

    try {
      // Try to get some basic info about the injector
      console.log(`${indent}📦 Injector Level ${level}`);

      // Check for common tokens
      const commonTokens = [
        'Router',
        'HttpClient',
        'AuthService',
        'TranslateService',
        'ApplicationRef',
      ];

      commonTokens.forEach((token) => {
        try {
          const instance = injector.get(token as unknown as Type<unknown>, null);
          if (instance) {
            console.log(`${indent}   ✅ ${token}: Available`);
          }
        } catch (e) {
          console.log(`${indent}   ❌ Service not available`);
        }
      });
    } catch (error) {
      console.log(
        `${indent}❌ Error analyzing injector: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
