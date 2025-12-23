import { Directive, HostBinding } from '@angular/core';

@Directive({
  selector: '[zCard]',
  standalone: true,
})
export class ZCardDirective {
  @HostBinding('class')
  readonly elementClass =
    'relative z-10 space-y-3 p-4 bg-white/30 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/40 transition-all duration-300';
}
