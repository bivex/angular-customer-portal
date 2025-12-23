/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T18:52:08
 * Last Updated: 2025-12-20T22:05:57
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Domain abstractions for RxJS operators
 * These interfaces provide abstractions for reactive programming operations
 */

import { Observable, OperatorFunction } from 'rxjs';

// Generic type aliases for RxJS operators
export type ObservableFilter<T> = OperatorFunction<T, T>;
export type ObservableMap<T, R> = OperatorFunction<T, R>;
export type ObservableTake<T> = OperatorFunction<T, T>;
export type ObservableCatchError<T, R = T> = OperatorFunction<T, R>;

// Domain interfaces for RxJS operations
export interface IRxJSOperators {
  getFilterOperator<T>(predicate: (value: T) => boolean): OperatorFunction<T, T>;
  getMapOperator<T, R>(project: (value: T) => R): OperatorFunction<T, R>;
  getTakeOperator<T>(count: number): OperatorFunction<T, T>;
  getCatchErrorOperator<T, R = T>(
    selector: (err: any, caught: Observable<T>) => Observable<R>
  ): OperatorFunction<T, T | R>;
}

// Domain interface for Observable operations
export interface IObservableOperations {
  filter<T>(source: Observable<T>, predicate: (value: T) => boolean): Observable<T>;
  map<T, R>(source: Observable<T>, project: (value: T) => R): Observable<R>;
  take<T>(source: Observable<T>, count: number): Observable<T>;
  catchError<T, R = T>(
    source: Observable<T>,
    selector: (err: any, caught: Observable<T>) => Observable<R>
  ): Observable<T | R>;
}
