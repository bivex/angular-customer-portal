/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T22:05:58
 * Last Updated: 2025-12-23T02:28:36
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map, take, catchError } from 'rxjs/operators';
import {
  IRxJSOperators,
  IObservableOperations,
} from '../../domain/interfaces/rxjs-abstractions.interface';

@Injectable({
  providedIn: 'root',
})
export class RxJSOperationsService implements IRxJSOperators, IObservableOperations {
  // IRxJSOperators implementation
  getFilterOperator<T>(predicate: (value: T) => boolean) {
    return filter(predicate);
  }

  getMapOperator<T, R>(project: (value: T) => R) {
    return map(project);
  }

  getTakeOperator<T>(count: number) {
    return take(count) as any;
  }

  getCatchErrorOperator<T, R = T>(selector: (err: any, caught: Observable<T>) => Observable<R>) {
    return catchError(selector) as any;
  }

  // IObservableOperations implementation
  filter<T>(source: Observable<T>, predicate: (value: T) => boolean): Observable<T> {
    return source.pipe(filter(predicate));
  }

  map<T, R>(source: Observable<T>, project: (value: T) => R): Observable<R> {
    return source.pipe(map(project));
  }

  take<T>(source: Observable<T>, count: number): Observable<T> {
    return source.pipe(take(count));
  }

  catchError<T, R = T>(
    source: Observable<T>,
    selector: (err: any, caught: Observable<T>) => Observable<R>
  ): Observable<T | R> {
    return source.pipe(catchError(selector));
  }
}
