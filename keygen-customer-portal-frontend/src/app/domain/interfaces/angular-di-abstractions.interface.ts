/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T18:52:29
 * Last Updated: 2025-12-20T22:05:57
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Domain abstractions for Angular Dependency Injection
 * These interfaces provide abstractions for DI operations
 */

import { Type, InjectionToken } from '@angular/core';

// Generic type for injection tokens
export type InjectionTokenType<T> = Type<T> | InjectionToken<T>;

// Domain interface for dependency injection operations
export interface IAngularDependencyInjector {
  get<T>(token: InjectionTokenType<T>): T;
  getOptional<T>(token: InjectionTokenType<T>): T | null;
}

// Domain interface for platform detection
export interface IPlatformDetector {
  isBrowser(): boolean;
  isServer(): boolean;
  getPlatformId(): string;
}

// Domain interface for Angular signals
export interface ISignalOperations {
  createSignal<T>(initialValue: T): ISignal<T>;
  createComputed<T>(computation: () => T): IReadonlySignal<T>;
}

// Domain signal interfaces
export interface ISignal<T> extends IReadonlySignal<T> {
  set(value: T): void;
  update(updater: (current: T) => T): void;
}

export type IReadonlySignal<T> = () => T;

// Domain interface for router operations
export interface IRouterOperations {
  navigate(commands: any[], extras?: any): Promise<boolean>;
  getCurrentUrl(): string;
  subscribeToNavigation(callback: (url: string) => void): () => void;
}
