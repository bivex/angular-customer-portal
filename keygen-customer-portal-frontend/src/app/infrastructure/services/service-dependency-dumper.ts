/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T22:05:57
 * Last Updated: 2025-12-20T22:05:57
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Injectable, Injector, Type } from '@angular/core';
import {
  IServiceDependencyDumper,
  ServiceMetadata,
} from '../../domain/interfaces/architecture-dumper.interface';

@Injectable({
  providedIn: 'root',
})
export class ServiceDependencyDumperService implements IServiceDependencyDumper {
  constructor(private injector: Injector) {}

  /**
   * Dump service dependencies
   */
  dumpServiceDependencies(): void {
    console.group('🔧 Service Dependencies');

    try {
      // Get all services from injector
      const services = this.getServicesFromInjector();
      services.forEach((service) => {
        console.log(`📋 Service: ${service['name']}`);
        console.log(`   Type: ${service['type']}`);
        console.log(`   Provided In: ${service.providedIn || 'Unknown'}`);
        console.log('');
      });
    } catch (error) {
      console.error('Error dumping service dependencies:', error);
    }

    console.groupEnd();
  }

  /**
   * Get services from injector
   */
  private getServicesFromInjector(): ServiceMetadata[] {
    // This is a simplified implementation
    // In a real scenario, you'd need more sophisticated reflection
    const services: ServiceMetadata[] = [];

    try {
      // Common Angular services to check
      const commonServices = [
        { name: 'Router', type: 'Service' },
        { name: 'HttpClient', type: 'Service' },
        { name: 'AuthService', type: 'Service' },
        { name: 'TranslateService', type: 'Service' },
      ];

      commonServices.forEach((service) => {
        try {
          const instance = this.injector.get(service.name as unknown as Type<unknown>, null);
          if (instance) {
            services.push({
              name: service.name,
              type: service.type,
              providedIn: 'root',
              instance: instance
                ? (instance as { constructor?: { name?: string } }).constructor?.name || 'Unknown'
                : 'Unknown',
            });
          }
        } catch (e) {
          // Service not available, skip
        }
      });
    } catch (error) {
      console.error('Error getting services:', error);
    }

    return services;
  }

  getServiceDependenciesData(): ServiceMetadata[] {
    return this.getServicesFromInjector();
  }
}
