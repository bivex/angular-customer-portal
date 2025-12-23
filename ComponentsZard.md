ccordion
A vertically stacked set of interactive headings that each reveal a section of content.

AI Assist

Previous
Next
Preview
Code
import { ChangeDetectionStrategy, Component } from '@angular/core';
 
import { ZardAccordionItemComponent } from '../accordion-item.component';
import { ZardAccordionComponent } from '../accordion.component';
 
@Component({
  selector: 'z-demo-accordion-basic',
  imports: [ZardAccordionComponent, ZardAccordionItemComponent],
  template: `
    <z-accordion zDefaultValue="item-2">
      <z-accordion-item zValue="item-1" zTitle="A Study in Scarlet">
        The first case of Sherlock Holmes and Dr. Watson. They investigate a murder in London, which leads to a
        backstory involving Mormons in the U.S. Introduces Holmes’s deductive method.
      </z-accordion-item>
 
      <z-accordion-item zValue="item-2" zTitle="The Sign of Four" zDescription="Sir Arthur Conan Doyle">
        The first case of Sherlock Holmes and Dr. Watson. They investigate a murder in London, which leads to a
        backstory involving Mormons in the U.S. Introduces Holmes’s deductive method.
      </z-accordion-item>
 
      <z-accordion-item zValue="item-3" zTitle="The Hound of the Baskervilles">
        Holmes and Watson investigate the legend of a demonic hound haunting the Baskerville family. Set in the eerie
        Dartmoor moorlands, the story involves betrayal and greed.
      </z-accordion-item>
    </z-accordion>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZardDemoAccordionBasicComponent {}
  Avatar
An image element with a fallback for representing the user.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardAvatarGroupComponent } from '../avatar-group.component';
import { ZardAvatarComponent } from '../avatar.component';
 
@Component({
  selector: 'z-demo-avatar-basic',
  imports: [ZardAvatarComponent, ZardAvatarGroupComponent],
  standalone: true,
  template: `
    <z-avatar zSrc="/images/avatar/imgs/avatar_image.jpg" zFallback="ZA" [zSize]="32" />
    <z-avatar zSrc="error-image.png" zFallback="ZA" zSize="sm" />
 
    <z-avatar-group>
      <z-avatar zSrc="/images/avatar/imgs/avatar_image.jpg" zFallback="JD" zSize="sm" />
      <z-avatar zSrc="https://github.com/srizzon.png" zFallback="SA" zSize="sm" />
      <z-avatar zSrc="https://github.com/Luizgomess.png" zFallback="LU" zSize="sm" />
    </z-avatar-group>
  `,
})
export class ZardDemoAvatarBasicComponent {}
 Button
Displays a button or a component that looks like a button.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardIconComponent } from '../../icon/icon.component';
import { ZardButtonComponent } from '../button.component';
 
@Component({
  selector: 'z-demo-button-default',
  imports: [ZardButtonComponent, ZardIconComponent],
  standalone: true,
  template: `
    <button z-button zType="outline">Button</button>
    <button z-button zType="outline"><i z-icon zType="arrow-up"></i></button>
    <button z-button zType="outline">
      Button
      <i z-icon zType="popcorn"></i>
    </button>
  `,
})
export class ZardDemoButtonDefaultComponent {}
 Card
Displays a card with header, content, and footer.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { generateId } from '@/shared/utils/merge-classes';
 
@Component({
  selector: 'z-demo-card-default',
  imports: [ZardCardComponent, ZardButtonComponent],
  template: `
    <z-card
      class="w-full md:w-94"
      zTitle="Login to your account"
      zDescription="Enter your email below to login to your account"
      zAction="Sign Up"
      (zActionClick)="onActionClick()"
    >
      <div class="space-y-4">
        <div class="space-y-2">
          <label
            [for]="idEmail"
            class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Email
          </label>
          <input
            [id]="idEmail"
            type="email"
            placeholder="m@example.com"
            class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            required
          />
        </div>
        <div class="space-y-2">
          <div class="flex items-center">
            <label
              [for]="idPassword"
              class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Password
            </label>
            <a href="#" class="ml-auto text-sm underline-offset-4 hover:underline">Forgot your password?</a>
          </div>
          <input
            [id]="idPassword"
            type="password"
            class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            required
          />
        </div>
      </div>
      <div card-footer class="flex w-full flex-col gap-2">
        <z-button zType="default">Login</z-button>
        <z-button zType="outline">Login with Google</z-button>
      </div>
    </z-card>
  `,
})
export class ZardDemoCardDefaultComponent {
  protected readonly idEmail = generateId('email');
  protected readonly idPassword = generateId('password');
 
  protected onActionClick(): void {
    alert('Redirect to Sign Up');
  }
}
 Combobox
A combobox is an autocomplete input and command palette with a list of suggestions. The Combobox is built using a composition of the <Popover /> and the <Command /> components.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardComboboxComponent, type ZardComboboxOption } from '../combobox.component';
 
@Component({
  selector: 'zard-demo-combobox-default',
  imports: [ZardComboboxComponent],
  standalone: true,
  template: `
    <z-combobox
      [options]="frameworks"
      class="w-[200px]"
      placeholder="Select framework..."
      searchPlaceholder="Search framework..."
      emptyText="No framework found."
      (zComboSelected)="onSelect($event)"
    />
  `,
})
export class ZardDemoComboboxDefaultComponent {
  frameworks: ZardComboboxOption[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue.js' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'ember', label: 'Ember.js' },
    { value: 'nextjs', label: 'Next.js' },
  ];
 
  onSelect(option: ZardComboboxOption) {
    console.log('Selected:', option);
  }
}
 Dialog
A window overlaid on either the primary window or another dialog window, rendering the content underneath inert.

AI Assist

Previous
Next
Preview
Code
import { ChangeDetectionStrategy, Component, inject, type AfterViewInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
 
import { ZardButtonComponent } from '../../button/button.component';
import { ZardInputDirective } from '../../input/input.directive';
import { ZardSelectItemComponent } from '../../select/select-item.component';
import { ZardSelectComponent } from '../../select/select.component';
import { ZardDialogModule } from '../dialog.component';
import { Z_MODAL_DATA, ZardDialogService } from '../dialog.service';
 
interface iDialogData {
  name: string;
  username: string;
}
 
@Component({
  selector: 'zard-demo-dialog-basic',
  imports: [FormsModule, ReactiveFormsModule, ZardInputDirective, ZardSelectComponent, ZardSelectItemComponent],
  template: `
    <form [formGroup]="form" class="grid gap-4">
      <div class="grid gap-3">
        <label
          for="name"
          class="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          Name
        </label>
        <input z-input formControlName="name" />
      </div>
 
      <div class="grid gap-3">
        <label
          for="username"
          class="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          Username
        </label>
        <input z-input formControlName="username" />
      </div>
 
      <div class="grid gap-3">
        <label
          for="region"
          class="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          Region
        </label>
        <z-select formControlName="region">
          <z-select-item zValue="africa">Africa</z-select-item>
          <z-select-item zValue="america">America</z-select-item>
          <z-select-item zValue="asia">Asia</z-select-item>
          <z-select-item zValue="australia">Australia</z-select-item>
          <z-select-item zValue="europe">Europe</z-select-item>
        </z-select>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'zardDemoDialogBasic',
})
export class ZardDemoDialogBasicInputComponent implements AfterViewInit {
  private zData: iDialogData = inject(Z_MODAL_DATA);
 
  form = new FormGroup({
    name: new FormControl('Pedro Duarte'),
    username: new FormControl('@peduarte'),
    region: new FormControl(''),
  });
 
  ngAfterViewInit(): void {
    if (this.zData) {
      this.form.patchValue(this.zData);
    }
  }
}
 
@Component({
  imports: [ZardButtonComponent, ZardDialogModule],
  template: `
    <button type="button" z-button zType="outline" (click)="openDialog()">Edit profile</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZardDemoDialogBasicComponent {
  private dialogService = inject(ZardDialogService);
 
  openDialog() {
    this.dialogService.create({
      zTitle: 'Edit Profile',
      zDescription: `Make changes to your profile here. Click save when you're done.`,
      zContent: ZardDemoDialogBasicInputComponent,
      zData: {
        name: 'Samuel Rizzon',
        username: '@samuelrizzondev',
        region: 'america',
      } as iDialogData,
      zOkText: 'Save changes',
      zOnOk: instance => {
        console.log('Form submitted:', instance.form.value);
      },
      zWidth: '425px',
    });
  }
}
 Empty
The Empty component displays a placeholder when no data is available, commonly used in tables, lists, or search results.

AI Assist

Previous
Next
Preview
Code
import { ChangeDetectionStrategy, Component } from '@angular/core';
 
import { ZardButtonComponent } from '../../button/button.component';
import { ZardIconComponent } from '../../icon/icon.component';
import { ZardEmptyComponent } from '../empty.component';
 
@Component({
  selector: 'z-demo-empty-default',
  imports: [ZardButtonComponent, ZardEmptyComponent, ZardIconComponent],
  standalone: true,
  template: `
    <z-empty
      zIcon="folder-code"
      zTitle="No Projects Yet"
      zDescription="You haven't created any projects yet. Get started by creating your first project."
      [zActions]="[actionPrimary, actionSecondary]"
    >
      <ng-template #actionPrimary>
        <button z-button>Create Project</button>
      </ng-template>
 
      <ng-template #actionSecondary>
        <button z-button zType="outline">Import Project</button>
      </ng-template>
 
      <button z-button zType="link" zSize="sm" class="text-muted-foreground">
        Learn More
        <i z-icon zType="arrow-up-right"></i>
      </button>
    </z-empty>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZardDemoEmptyDefaultComponent {}
 Input
Displays a form input field or a component that looks like an input field.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardInputDirective } from '../input.directive';
 
@Component({
  selector: 'z-demo-input-default',
  imports: [ZardInputDirective],
  standalone: true,
  template: `
    <input z-input placeholder="Default" />
    <input z-input disabled placeholder="Disabled" />
  `,
})
export class ZardDemoInputDefaultComponent {}
 
Layout
A set of layout components for creating common page structures with header, footer, sidebar, and content areas.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ContentComponent } from '../content.component';
import { FooterComponent } from '../footer.component';
import { HeaderComponent } from '../header.component';
import { LayoutComponent } from '../layout.component';
import { SidebarComponent } from '../sidebar.component';
 
@Component({
  selector: 'z-demo-layout-basic',
  imports: [LayoutComponent, HeaderComponent, ContentComponent, FooterComponent, SidebarComponent],
  standalone: true,
  template: `
    <div class="flex flex-col gap-6 text-center">
      <z-layout class="overflow-hidden rounded-lg">
        <z-header class="h-16 justify-center border-0 bg-[#4096ff] px-12 text-white">Header</z-header>
        <z-content class="min-h-[200px] bg-[#0958d9] text-white">Content</z-content>
        <z-footer class="h-16 justify-center border-0 bg-[#4096ff] px-12 text-white">Footer</z-footer>
      </z-layout>
 
      <z-layout class="overflow-hidden rounded-lg">
        <z-header class="h-16 justify-center border-0 bg-[#4096ff] px-12 text-white">Header</z-header>
        <z-layout>
          <z-sidebar class="border-0 bg-[#1677ff] text-white" [zWidth]="120">Sidebar</z-sidebar>
          <z-content class="min-h-[200px] bg-[#0958d9] text-white">Content</z-content>
        </z-layout>
        <z-footer class="h-16 justify-center border-0 bg-[#4096ff] px-12 text-white">Footer</z-footer>
      </z-layout>
 
      <z-layout class="overflow-hidden rounded-lg">
        <z-header class="h-16 justify-center border-0 bg-[#4096ff] px-12 text-white">Header</z-header>
        <z-layout>
          <z-content class="min-h-[200px] bg-[#0958d9] text-white">Content</z-content>
          <z-sidebar class="border-0 bg-[#1677ff] text-white" [zWidth]="120">Sidebar</z-sidebar>
        </z-layout>
        <z-footer class="h-16 justify-center border-0 bg-[#4096ff] px-12 text-white">Footer</z-footer>
      </z-layout>
 
      <z-layout class="overflow-hidden rounded-lg">
        <z-sidebar class="border-0 bg-[#1677ff] text-white" [zWidth]="120">Sidebar</z-sidebar>
        <z-layout>
          <z-header class="h-16 justify-center border-0 bg-[#4096ff] px-12 text-white">Header</z-header>
          <z-content class="min-h-[200px] bg-[#0958d9] text-white">Content</z-content>
          <z-footer class="h-16 justify-center border-0 bg-[#4096ff] px-12 text-white">Footer</z-footer>
        </z-layout>
      </z-layout>
    </div>
  `,
})
export class LayoutDemoBasicComponent {}
 Pagination
Pagination with page navigation, next and previous links.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardPaginationModule } from '../pagination.module';
 
@Component({
  selector: 'z-demo-pagination-default',
  imports: [ZardPaginationModule],
  template: `
    <z-pagination [zTotal]="5" [(zPageIndex)]="currentPage" />
  `,
})
export class ZardDemoPaginationDefaultComponent {
  protected currentPage = 2;
}
 Radio
A radio button component for selecting a single option from a list.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
 
import { ZardRadioComponent } from '../radio.component';
 
@Component({
  selector: 'z-demo-radio-default',
  imports: [ZardRadioComponent, FormsModule],
  standalone: true,
  template: `
    <div class="flex flex-col gap-3">
      <span z-radio name="option" [(ngModel)]="selected" value="default">Default</span>
      <span z-radio name="option" [(ngModel)]="selected" value="comfortable">Comfortable</span>
      <span z-radio name="option" [(ngModel)]="selected" value="compact">Compact</span>
    </div>
  `,
})
export class ZardDemoRadioDefaultComponent {
  selected = 'default';
}
 Select
Displays a list of options for the user to pick from—triggered by a button.

AI Assist

Previous
Next
Preview
Code
import { ChangeDetectionStrategy, Component } from '@angular/core';
 
import { ZardBadgeComponent } from '../../badge/badge.component';
import { ZardSelectModule } from '../select.module';
 
@Component({
  selector: 'z-demo-select-basic',
  imports: [ZardBadgeComponent, ZardSelectModule],
  template: `
    <div class="flex flex-col gap-4">
      <span>
        Selected value:
        @if (selectedValue) {
          <z-badge>{{ selectedValue }}</z-badge>
        }
      </span>
      <z-select class="w-[300px]" zPlaceholder="Select a fruit" [(zValue)]="selectedValue">
        <z-select-item zValue="apple">Apple</z-select-item>
        <z-select-item zValue="banana">Banana</z-select-item>
        <z-select-item zValue="blueberry">Blueberry</z-select-item>
        <z-select-item zValue="grapes">Grapes</z-select-item>
        <z-select-item zValue="pineapple" zDisabled>Pineapple</z-select-item>
      </z-select>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZardDemoSelectBasicComponent {
  selectedValue = '';
}
 Slider
An input where the user selects a value from within a given range.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardSliderComponent } from '../slider.component';
 
@Component({
  selector: 'z-demo-slider-default',
  imports: [ZardSliderComponent],
  standalone: true,
  template: `
    <div class="preview flex min-h-[350px] w-full items-center justify-center p-10">
      <z-slider class="w-[60%]" zDefault="50" />
    </div>
  `,
})
export class ZardDemoSliderDefaultComponent {}
 Tab
A set of layered sections of content—known as tab panels—that are displayed one at a time.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardTabComponent, ZardTabGroupComponent } from '../tabs.component';
 
@Component({
  selector: 'z-demo-tabs-default',
  imports: [ZardTabComponent, ZardTabGroupComponent],
  standalone: true,
  template: `
    <div class="h-[300px] w-full">
      <z-tab-group>
        <z-tab label="First">
          <p>Is the default tab component</p>
        </z-tab>
        <z-tab label="Second">
          <p>Content of the second tab</p>
        </z-tab>
        <z-tab label="Third">
          <p>Content of the third tab</p>
        </z-tab>
        <z-tab label="Fourth">
          <p>Content of the fourth tab</p>
        </z-tab>
        <z-tab label="Fifth">
          <p>Content of the fifth tab</p>
        </z-tab>
        <z-tab label="Sixth">
          <p>Content of the sixth tab</p>
        </z-tab>
      </z-tab-group>
    </div>
  `,
})
export class ZardDemoTabsDefaultComponent {}
 Toggle Group
A set of two-state buttons that can be pressed or released. Multiple buttons can be selected at the same time.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardToggleGroupComponent, type ZardToggleGroupItem } from '../toggle-group.component';
 
@Component({
  selector: 'demo-toggle-group-default',
  imports: [ZardToggleGroupComponent],
  standalone: true,
  template: `
    <z-toggle-group
      zMode="multiple"
      [items]="items"
      [defaultValue]="['italic']"
      (valueChange)="onToggleChange($event)"
    />
  `,
})
export default class ToggleGroupDefaultComponent {
  items: ZardToggleGroupItem[] = [
    {
      value: 'bold',
      icon: 'bold',
      ariaLabel: 'Toggle bold',
    },
    {
      value: 'italic',
      icon: 'italic',
      ariaLabel: 'Toggle italic',
    },
    {
      value: 'underline',
      icon: 'underline',
      ariaLabel: 'Toggle underline',
    },
  ];
 
  onToggleChange(value: string | string[]) {
    console.log('Toggle group changed:', value);
  }
}
 Alert
Displays a callout for user attention.

AI Assist

Previous
Next
Preview
Code
import { ChangeDetectionStrategy, Component } from '@angular/core';
 
import { ZardIconComponent } from '../../icon/icon.component';
import { ZardAlertComponent } from '../alert.component';
 
@Component({
  selector: 'z-demo-alert-basic',
  imports: [ZardAlertComponent, ZardIconComponent],
  standalone: true,
  template: `
    <div class="grid w-full max-w-xl items-start gap-4">
      <z-alert
        zIcon="circle-check"
        zTitle="Success! Your changes have been saved"
        zDescription="This is an alert with icon, title and description."
      />
 
      <z-alert [zIcon]="customIcon" zTitle="This Alert has a title and an icon. No description." />
 
      <ng-template #customIcon>
        <z-icon zType="popcorn" />
      </ng-template>
 
      <z-alert zType="destructive" zTitle="Unable to process your payment." [zDescription]="customDescription" />
 
      <ng-template #customDescription>
        <p>Please verify your billing information and try again.</p>
        <ul class="list-disc pl-5">
          <li>Check your card details</li>
          <li>Ensure sufficient funds</li>
          <li>Verify billing address</li>
        </ul>
      </ng-template>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZardDemoAlertBasicComponent {}
 Badge
Displays a badge or a component that looks like a badge.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardIconComponent } from '../../icon/icon.component';
import { ZardBadgeComponent } from '../badge.component';
 
@Component({
  selector: 'z-demo-badge-default',
  imports: [ZardBadgeComponent, ZardIconComponent],
  standalone: true,
  template: `
    <div class="flex flex-col items-center gap-2">
      <div class="flex w-full flex-wrap gap-2">
        <z-badge>Badge</z-badge>
        <z-badge zType="secondary">Secondary</z-badge>
        <z-badge zType="destructive">Destructive</z-badge>
        <z-badge zType="outline">Outline</z-badge>
      </div>
      <div class="flex w-full flex-wrap gap-2">
        <z-badge zType="secondary" class="bg-blue-500 text-white dark:bg-blue-600">
          <z-icon zType="badge-check" />
          Verified
        </z-badge>
        <z-badge zShape="pill" class="h-5 min-w-5 px-1 font-mono tabular-nums">8</z-badge>
        <z-badge zShape="pill" zType="destructive" class="h-5 min-w-5 px-1 font-mono tabular-nums">99</z-badge>
        <z-badge zShape="pill" zType="outline" class="h-5 min-w-5 px-1 font-mono tabular-nums">20+</z-badge>
      </div>
    </div>
  `,
})
export class ZardDemoBadgeDefaultComponent {}
 Button Group
A container that groups related buttons together with consistent styling.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardButtonGroupComponent } from '@/shared/components/button-group/button-group.component';
import { ZardDividerComponent } from '@/shared/components/divider';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
 
@Component({
  selector: 'z-demo-button-group-default',
  imports: [ZardButtonGroupComponent, ZardButtonComponent, ZardIconComponent, ZardMenuImports, ZardDividerComponent],
  template: `
    <z-button-group>
      <z-button-group class="hidden sm:flex">
        <button type="button" z-button zType="outline" aria-label="Go Back">
          <i z-icon zType="arrow-left"></i>
        </button>
      </z-button-group>
 
      <z-button-group>
        <button type="button" z-button zType="outline">Archive</button>
        <button type="button" z-button zType="outline">Report</button>
      </z-button-group>
 
      <z-button-group>
        <button type="button" z-button zType="outline">Snooze</button>
        <button type="button" z-button zType="outline" z-menu [zMenuTriggerFor]="menu">
          <i z-icon zType="ellipsis"></i>
 
          <ng-template #menu>
            <div z-menu-content class="w-48">
              <button type="button" z-menu-item>
                <i z-icon zType="check"></i>
                Mark as Read
              </button>
              <button type="button" z-menu-item>
                <i z-icon zType="archive"></i>
                Archive
              </button>
 
              <z-divider zSpacing="sm" />
 
              <button type="button" z-menu-item>
                <i z-icon zType="clock"></i>
                Snooze
              </button>
              <button type="button" z-menu-item>
                <i z-icon zType="calendar-plus"></i>
                Add to Calendar
              </button>
              <button type="button" z-menu-item>
                <i z-icon zType="list-filter-plus"></i>
                Add to List
              </button>
              <button
                type="button"
                z-menu-item
                z-menu
                [zMenuTriggerFor]="subMenu"
                zPlacement="rightTop"
                class="justify-between"
              >
                <div class="flex items-center">
                  <i z-icon zType="tag" class="mr-1"></i>
                  Label as
                </div>
                <i z-icon zType="chevron-right"></i>
 
                <ng-template #subMenu>
                  <div z-menu-content class="w-48">
                    <button type="button" z-menu-item>Personal</button>
                    <button type="button" z-menu-item>Work</button>
                    <button type="button" z-menu-item>Other</button>
                  </div>
                </ng-template>
              </button>
 
              <z-divider zSpacing="sm" />
 
              <button type="button" z-menu-item class="text-red-500">
                <i z-icon zType="trash"></i>
                Trash
              </button>
            </div>
          </ng-template>
        </button>
      </z-button-group>
    </z-button-group>
  `,
})
export class ZardDemoButtonGroupDefaultComponent {}
 Button Group
A container that groups related buttons together with consistent styling.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardButtonGroupComponent } from '@/shared/components/button-group/button-group.component';
import { ZardDividerComponent } from '@/shared/components/divider';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
 
@Component({
  selector: 'z-demo-button-group-default',
  imports: [ZardButtonGroupComponent, ZardButtonComponent, ZardIconComponent, ZardMenuImports, ZardDividerComponent],
  template: `
    <z-button-group>
      <z-button-group class="hidden sm:flex">
        <button type="button" z-button zType="outline" aria-label="Go Back">
          <i z-icon zType="arrow-left"></i>
        </button>
      </z-button-group>
 
      <z-button-group>
        <button type="button" z-button zType="outline">Archive</button>
        <button type="button" z-button zType="outline">Report</button>
      </z-button-group>
 
      <z-button-group>
        <button type="button" z-button zType="outline">Snooze</button>
        <button type="button" z-button zType="outline" z-menu [zMenuTriggerFor]="menu">
          <i z-icon zType="ellipsis"></i>
 
          <ng-template #menu>
            <div z-menu-content class="w-48">
              <button type="button" z-menu-item>
                <i z-icon zType="check"></i>
                Mark as Read
              </button>
              <button type="button" z-menu-item>
                <i z-icon zType="archive"></i>
                Archive
              </button>
 
              <z-divider zSpacing="sm" />
 
              <button type="button" z-menu-item>
                <i z-icon zType="clock"></i>
                Snooze
              </button>
              <button type="button" z-menu-item>
                <i z-icon zType="calendar-plus"></i>
                Add to Calendar
              </button>
              <button type="button" z-menu-item>
                <i z-icon zType="list-filter-plus"></i>
                Add to List
              </button>
              <button
                type="button"
                z-menu-item
                z-menu
                [zMenuTriggerFor]="subMenu"
                zPlacement="rightTop"
                class="justify-between"
              >
                <div class="flex items-center">
                  <i z-icon zType="tag" class="mr-1"></i>
                  Label as
                </div>
                <i z-icon zType="chevron-right"></i>
 
                <ng-template #subMenu>
                  <div z-menu-content class="w-48">
                    <button type="button" z-menu-item>Personal</button>
                    <button type="button" z-menu-item>Work</button>
                    <button type="button" z-menu-item>Other</button>
                  </div>
                </ng-template>
              </button>
 
              <z-divider zSpacing="sm" />
 
              <button type="button" z-menu-item class="text-red-500">
                <i z-icon zType="trash"></i>
                Trash
              </button>
            </div>
          </ng-template>
        </button>
      </z-button-group>
    </z-button-group>
  `,
})
export class ZardDemoButtonGroupDefaultComponent {}
 Carousel
A slideshow component for cycling through elements with support for mouse drag, touch swipe, and automatic playback.

AI Assist

Previous
Next
Preview
Code
import { ChangeDetectionStrategy, Component } from '@angular/core';
 
import { ZardCardComponent } from '../../card';
import { ZardCarouselModule } from '../carousel.module';
 
@Component({
  imports: [ZardCarouselModule, ZardCardComponent],
  template: `
    <div class="mx-auto w-3/4 max-w-md">
      <z-carousel>
        <z-carousel-content>
          @for (slide of slides; track slide) {
            <z-carousel-item>
              <z-card>
                <div class="flex h-[100px] items-center justify-center text-4xl font-semibold md:h-[200px]">
                  {{ slide }}
                </div>
              </z-card>
            </z-carousel-item>
          }
        </z-carousel-content>
      </z-carousel>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZardDemoCarouselDefaultComponent {
  protected slides = ['1', '2', '3', '4', '5'];
}
 Command
Fast, composable, styled command menu for Angular.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import type { ZardCommandOption } from '../command.component';
import { ZardCommandModule } from '../command.module';
 
@Component({
  selector: 'z-demo-command-default',
  imports: [ZardCommandModule],
  standalone: true,
  template: `
    <z-command class="md:min-w-[500px]" (zCommandSelected)="handleCommand($event)">
      <z-command-input placeholder="Search actions, files, and more..." />
      <z-command-list>
        <z-command-empty>No commands found.</z-command-empty>
 
        <z-command-option-group zLabel="Quick Actions">
          <z-command-option zLabel="Create new project" zValue="new-project" zIcon="folder" zShortcut="⌘N" />
          <z-command-option zLabel="Open file" zValue="open-file" zIcon="folder-open" zShortcut="⌘O" />
          <z-command-option zLabel="Save all" zValue="save-all" zIcon="save" zShortcut="⌘S" />
        </z-command-option-group>
 
        <z-command-divider />
 
        <z-command-option-group zLabel="Navigation">
          <z-command-option zLabel="Go to Dashboard" zValue="dashboard" zIcon="layout-dashboard" zShortcut="⌘1" />
          <z-command-option zLabel="Go to Projects" zValue="projects" zIcon="folder" zShortcut="⌘2" />
        </z-command-option-group>
 
        <z-command-divider />
 
        <z-command-option-group zLabel="Tools">
          <z-command-option zLabel="Open terminal" zValue="terminal" zIcon="terminal" zShortcut="⌘T" />
          <z-command-option zLabel="Toggle theme" zValue="theme" zIcon="moon" zShortcut="⌘D" />
        </z-command-option-group>
      </z-command-list>
    </z-command>
  `,
  host: {
    '(window:keydown)': 'handleKeydown($event)',
  },
})
export class ZardDemoCommandDefaultComponent {
  // Handle command selection
  handleCommand(option: ZardCommandOption) {
    const action = `Executed "${option.label}" (value: ${option.value})`;
    console.log(action);
 
    // You can add real logic here
    switch (option.value) {
      case 'new-project':
        this.showAlert('Creating new project...');
        break;
      case 'open-file':
        this.showAlert('Opening file dialog...');
        break;
      case 'save-all':
        this.showAlert('Saving all files...');
        break;
      case 'dashboard':
        this.showAlert('Navigating to Dashboard...');
        break;
      case 'projects':
        this.showAlert('Navigating to Projects...');
        break;
      case 'terminal':
        this.showAlert('Opening terminal...');
        break;
      case 'theme':
        this.showAlert('Toggling theme...');
        break;
      default:
        this.showAlert(`Action: ${option.label}`);
    }
  }
 
  // Handle keyboard shortcuts
  handleKeydown(event: KeyboardEvent) {
    if (event.metaKey || event.ctrlKey) {
      if ('nos12td'.includes(event.key.toLowerCase())) {
        event.preventDefault();
      }
 
      switch (event.key.toLowerCase()) {
        case 'n':
          this.executeCommand('new-project', 'Create new project');
          break;
        case 'o':
          this.executeCommand('open-file', 'Open file');
          break;
        case 's':
          this.executeCommand('save-all', 'Save all');
          break;
        case '1':
          this.executeCommand('dashboard', 'Go to Dashboard');
          break;
        case '2':
          this.executeCommand('projects', 'Go to Projects');
          break;
        case 't':
          this.executeCommand('terminal', 'Open terminal');
          break;
        case 'd':
          this.executeCommand('theme', 'Toggle theme');
          break;
      }
    }
  }
 
  private executeCommand(value: string, label: string) {
    this.handleCommand({ value, label } as ZardCommandOption);
  }
 
  private showAlert(message: string, isWarning = false) {
    if (isWarning) {
      console.warn(message);
    } else {
      console.log(message);
    }
 
    // In a real app, you might show a toast notification here
    setTimeout(() => {
      // You could clear the action after some time
    }, 3000);
  }
}
 Divider
The Divider component is used to visually separate content with a horizontal or vertical line.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardDividerComponent } from '../divider.component';
 
@Component({
  selector: 'z-demo-divider-default',
  imports: [ZardDividerComponent],
  standalone: true,
  template: `
    <div class="flex flex-col">
      <p>Before divider</p>
      <z-divider />
      <p>After divider</p>
    </div>
  `,
})
export class ZardDemoDividerDefaultComponent {}
 Form
Building forms with proper structure, validation, and accessibility using composable form components.

AI Assist

Previous
Next
Preview
Code
import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
 
import { generateId } from '../../../utils/merge-classes';
import { ZardButtonComponent } from '../../button/button.component';
import { ZardInputDirective } from '../../input/input.directive';
import { ZardFormModule } from '../form.module';
 
@Component({
  selector: 'zard-demo-form-default',
  imports: [FormsModule, ZardButtonComponent, ZardInputDirective, ZardFormModule],
  standalone: true,
  template: `
    <form class="max-w-sm space-y-6">
      <z-form-field>
        <label z-form-label zRequired [for]="idFullName">Full Name</label>
        <z-form-control>
          <input
            z-input
            type="text"
            [id]="idFullName"
            placeholder="Enter your full name"
            [(ngModel)]="fullName"
            name="fullName"
          />
        </z-form-control>
        <z-form-message>This is your display name.</z-form-message>
      </z-form-field>
 
      <z-form-field>
        <label z-form-label zRequired [for]="idEmail">Email</label>
        <z-form-control>
          <input z-input type="email" [id]="idEmail" placeholder="Enter your email" [(ngModel)]="email" name="email" />
        </z-form-control>
        <z-form-message>We'll never share your email with anyone else.</z-form-message>
      </z-form-field>
 
      <z-form-field>
        <label z-form-label [for]="idBio">Bio</label>
        <z-form-control>
          <textarea
            z-input
            [id]="idBio"
            placeholder="Tell us about yourself"
            rows="3"
            [(ngModel)]="bio"
            name="bio"
          ></textarea>
        </z-form-control>
        <z-form-message>Optional: Brief description about yourself.</z-form-message>
      </z-form-field>
 
      <button z-button zType="default" type="submit">Submit</button>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ZardDemoFormDefaultComponent {
  protected readonly idFullName = generateId('fullName');
  protected readonly idEmail = generateId('email');
  protected readonly idBio = generateId('bio');
 
  fullName = '';
  email = '';
  bio = '';
}
 Input Group
A flexible input group that combines inputs with addons, prefixes, and suffixes to improve usability.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardDividerComponent } from '@/shared/components/divider';
import { ZardDropdownImports } from '@/shared/components/dropdown';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardInputGroupComponent } from '@/shared/components/input-group/input-group.component';
import { ZardTooltipDirective } from '@/shared/components/tooltip';
 
@Component({
  selector: 'z-demo-input-group-default',
  imports: [
    ZardButtonComponent,
    ZardDropdownImports,
    ZardIconComponent,
    ZardInputDirective,
    ZardInputGroupComponent,
    ZardDividerComponent,
    ZardTooltipDirective,
  ],
  template: `
    <div class="flex w-95 flex-col space-y-4">
      <z-input-group [zAddonBefore]="search" zAddonAfter="12 results" class="mb-4">
        <input z-input placeholder="Search..." />
      </z-input-group>
 
      <z-input-group zAddonBefore="https://" [zAddonAfter]="info" class="mb-4">
        <input z-input placeholder="example.com" />
      </z-input-group>
 
      <z-input-group class="mb-4" [zAddonAfter]="areaAfter">
        <textarea class="h-30 resize-none" z-input placeholder="Ask, Search or Chat..."></textarea>
      </z-input-group>
 
      <z-input-group [zAddonAfter]="check">
        <input z-input placeholder="@zardui" />
      </z-input-group>
    </div>
 
    <ng-template #search><z-icon zType="search" /></ng-template>
 
    <ng-template #check>
      <div class="bg-primary rounded-full p-0.5">
        <z-icon zType="check" class="stroke-primary-foreground" zSize="sm" />
      </div>
    </ng-template>
 
    <ng-template #info><z-icon zType="info" zTooltip="Element with tooltip" /></ng-template>
 
    <ng-template #areaAfter>
      <div class="flex w-full items-center justify-between">
        <div class="flex items-center gap-1">
          <button type="button" z-button zType="outline" zShape="circle" class="data-icon-only:size-6!">
            <z-icon zType="plus" />
          </button>
          <button type="button" z-button zType="ghost" class="h-6" z-dropdown [zDropdownMenu]="menu">Auto</button>
          <z-dropdown-menu-content #menu="zDropdownMenuContent" class="w-10">
            <z-dropdown-menu-item>Auto</z-dropdown-menu-item>
            <z-dropdown-menu-item>Agent</z-dropdown-menu-item>
            <z-dropdown-menu-item>Manual</z-dropdown-menu-item>
          </z-dropdown-menu-content>
        </div>
        <div class="flex h-auto items-center gap-0">
          <span>52% used</span>
          <z-divider zOrientation="vertical" class="h-4" />
          <button type="button" z-button zType="outline" zShape="circle" class="data-icon-only:size-6!">
            <z-icon zType="arrow-up" />
          </button>
        </div>
      </div>
    </ng-template>
  `,
})
export class ZardDemoInputGroupDefaultComponent {}
 Loader
The Loader is a visual component that displays a loading animation to indicate that an action or process is in progress.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardLoaderComponent } from '../loader.component';
 
@Component({
  selector: 'z-demo-loader-default',
  imports: [ZardLoaderComponent],
  standalone: true,
  template: `
    <z-loader />
  `,
})
export class ZardDemoLoaderDefaultComponent {}
 Popover
Displays rich content in a portal, triggered by a button.

AI Assist

Previous
Next
Preview
Code
import { ChangeDetectionStrategy, Component } from '@angular/core';
 
import { ZardButtonComponent } from '../../button/button.component';
import { ZardPopoverComponent, ZardPopoverDirective } from '../popover.component';
 
@Component({
  selector: 'z-popover-default-demo',
  imports: [ZardButtonComponent, ZardPopoverComponent, ZardPopoverDirective],
  standalone: true,
  template: `
    <button type="button" z-button zPopover [zContent]="popoverContent" zType="outline">Open popover</button>
 
    <ng-template #popoverContent>
      <z-popover>
        <div class="space-y-2">
          <h4 class="leading-none font-medium">Dimensions</h4>
          <p class="text-muted-foreground text-sm">Set the dimensions for the layer.</p>
        </div>
      </z-popover>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZardDemoPopoverDefaultComponent {}
 Resizable
A resizable layout component that allows users to resize panels by dragging dividers between them.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardResizableHandleComponent } from '../resizable-handle.component';
import { ZardResizablePanelComponent } from '../resizable-panel.component';
import { ZardResizableComponent } from '../resizable.component';
 
@Component({
  selector: 'z-demo-resizable-default',
  imports: [ZardResizableComponent, ZardResizablePanelComponent, ZardResizableHandleComponent],
  standalone: true,
  template: `
    <z-resizable class="h-[200px] w-[500px] max-w-md rounded-lg border">
      <z-resizable-panel>
        <div class="flex h-full items-center justify-center p-6">
          <span class="font-semibold">One</span>
        </div>
      </z-resizable-panel>
      <z-resizable-handle />
      <z-resizable-panel>
        <div class="flex h-full items-center justify-center p-6">
          <span class="font-semibold">Two</span>
        </div>
      </z-resizable-panel>
    </z-resizable>
  `,
})
export class ZardDemoResizableDefaultComponent {}
 Sheet
Extends the Dialog component to display content that complements the main content of the screen.

AI Assist

Previous
Next
Preview
Code
import { ChangeDetectionStrategy, Component, inject, type AfterViewInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
 
import { ZardButtonComponent } from '../../button/button.component';
import { ZardInputDirective } from '../../input/input.directive';
import { ZardSheetModule } from '../sheet.module';
import { Z_SHEET_DATA, ZardSheetService } from '../sheet.service';
 
interface iSheetData {
  name: string;
  username: string;
}
 
@Component({
  selector: 'zard-demo-sheet-basic',
  imports: [FormsModule, ReactiveFormsModule, ZardInputDirective],
  template: `
    <form [formGroup]="form" class="grid flex-1 auto-rows-min gap-6 px-4">
      <div class="grid gap-3">
        <label
          for="name"
          class="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          Name
        </label>
        <input
          z-input
          formControlName="name"
          class="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        />
      </div>
 
      <div class="grid gap-3">
        <label
          for="username"
          class="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          Username
        </label>
        <input
          z-input
          formControlName="username"
          class="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        />
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'zardDemoSheetBasic',
})
export class ZardDemoSheetBasicInputComponent implements AfterViewInit {
  private zData: iSheetData = inject(Z_SHEET_DATA);
 
  form = new FormGroup({
    name: new FormControl(''),
    username: new FormControl(''),
  });
 
  ngAfterViewInit(): void {
    if (this.zData) {
      this.form.patchValue(this.zData);
    }
  }
}
 
@Component({
  imports: [ZardButtonComponent, ZardSheetModule],
  standalone: true,
  template: `
    <button type="button" z-button zType="outline" (click)="openSheet()">Edit profile</button>
  `,
})
export class ZardDemoSheetBasicComponent {
  private sheetService = inject(ZardSheetService);
 
  openSheet() {
    this.sheetService.create({
      zTitle: 'Edit profile',
      zDescription: `Make changes to your profile here. Click save when you're done.`,
      zContent: ZardDemoSheetBasicInputComponent,
      zData: {
        name: 'Matheus Ribeiro',
        username: '@ribeiromatheus.dev',
      },
      zOkText: 'Save changes',
      zOnOk: instance => {
        console.log('Form submitted:', instance.form.value);
      },
    });
  }
}
 Switch
A control that allows the user to toggle between checked and unchecked.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardSwitchComponent } from '../switch.component';
 
@Component({
  selector: 'zard-demo-switch',
  imports: [ZardSwitchComponent],
  standalone: true,
  template: `
    <z-switch />
  `,
})
export class ZardDemoSwitchDefaultComponent {}
 Toast
A succinct message that is displayed temporarily.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { toast } from 'ngx-sonner';
 
import { ZardButtonComponent } from '../../button/button.component';
 
@Component({
  selector: 'zard-demo-toast',
  imports: [ZardButtonComponent],
  standalone: true,
  template: `
    <button z-button zType="outline" (click)="showToast()">Show Toast</button>
  `,
})
export class ZardDemoToastDefaultComponent {
  showToast() {
    toast('Event has been created', {
      description: 'Sunday, December 03, 2023 at 9:00 AM',
      action: {
        label: 'Undo',
        onClick: () => console.log('Undo'),
      },
    });
  }
}
 Tooltip
A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.

AI Assist

Previous
Preview
Code
import { Component } from '@angular/core';
 
import { ZardButtonComponent } from '../../button/button.component';
import { ZardTooltipModule } from '../tooltip';
 
@Component({
  selector: 'z-demo-tooltip-hover',
  imports: [ZardButtonComponent, ZardTooltipModule],
  template: `
    <button type="button" z-button zType="outline" zTooltip="Tooltip content">Hover</button>
  `,
})
export class ZardDemoTooltipHoverComponent {}
 Alert Dialog
A modal dialog that interrupts the user with important content and expects a response.

AI Assist

Previous
Next
Preview
Code
import { Component, inject } from '@angular/core';
 
import { ZardButtonComponent } from '../../button/button.component';
import { ZardAlertDialogService } from '../alert-dialog.service';
 
@Component({
  selector: 'zard-demo-alert-dialog-default',
  imports: [ZardButtonComponent],
  standalone: true,
  template: `
    <button z-button zType="outline" (click)="showDialog()">Show Dialog</button>
  `,
})
export class ZardDemoAlertDialogDefaultComponent {
  private alertDialogService = inject(ZardAlertDialogService);
 
  showDialog() {
    this.alertDialogService.confirm({
      zTitle: 'Are you absolutely sure?',
      zDescription:
        'This action cannot be undone. This will permanently delete your account and remove your data from our servers.',
      zOkText: 'Continue',
      zCancelText: 'Cancel',
    });
  }
}
 Breadcrumb
Displays the path to the current resource using a hierarchy of links.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardIconComponent } from '../../icon/icon.component';
import { ZardBreadcrumbModule } from '../breadcrumb.module';
 
@Component({
  selector: 'z-demo-breadcrumb-default',
  imports: [ZardBreadcrumbModule, ZardIconComponent],
  standalone: true,
  template: `
    <z-breadcrumb zWrap="wrap" zAlign="start">
      <z-breadcrumb-item [routerLink]="['/']">
        <z-icon zType="house" />
        Home
      </z-breadcrumb-item>
      <z-breadcrumb-item [routerLink]="['/docs/components']">Components</z-breadcrumb-item>
      <z-breadcrumb-item>Breadcrumb</z-breadcrumb-item>
    </z-breadcrumb>
  `,
})
export class ZardDemoBreadcrumbDefaultComponent {}
 Calendar
A flexible and accessible calendar component for selecting dates with three selection modes: single, multiple, and range. Built with modern Angular patterns and full keyboard navigation support.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardCalendarComponent } from '../calendar.component';
 
@Component({
  selector: 'z-demo-calendar-default',
  imports: [ZardCalendarComponent],
  standalone: true,
  template: `
    <z-calendar (dateChange)="onDateChange($event)" />
  `,
})
export class ZardDemoCalendarDefaultComponent {
  onDateChange(date: Date | Date[]) {
    console.log('Selected date:', date);
  }
}
 Checkbox
A control that allows the user to toggle between checked and not checked.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
 
import { ZardCheckboxComponent } from '../checkbox.component';
 
@Component({
  selector: 'z-demo-checkbox-default',
  imports: [ZardCheckboxComponent, FormsModule],
  standalone: true,
  template: `
    <span z-checkbox></span>
    <span z-checkbox [(ngModel)]="checked">Default Checked</span>
  `,
})
export class ZardDemoCheckboxDefaultComponent {
  checked = true;
}
 Date Picker
A date picker component that combines a button trigger with a calendar popup for intuitive date selection.

AI Assist

Previous
Next
Preview
Code
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
 
import { ZardDatePickerComponent } from '../date-picker.component';
 
@Component({
  selector: 'zard-demo-date-picker-default',
  imports: [ZardDatePickerComponent],
  standalone: true,
  template: `
    <z-date-picker [value]="selectedDate()" placeholder="Pick a date" (dateChange)="onDateChange($event)" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZardDemoDatePickerDefaultComponent {
  readonly selectedDate = signal<Date | null>(null);
 
  onDateChange(date: Date | null) {
    this.selectedDate.set(date);
    console.log('Selected date:', date);
  }
}
 Dropdown
Displays a menu to the user — such as a set of actions or functions — triggered by a button.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardDividerComponent } from '@/shared/components/divider';
import { ZardDropdownImports } from '@/shared/components/dropdown/dropdown.imports';
import { ZardMenuImports } from '@/shared/components/menu';
 
@Component({
  selector: 'z-dropdown-demo',
  imports: [ZardDropdownImports, ZardButtonComponent, ZardDividerComponent, ZardMenuImports],
  template: `
    <button type="button" z-button zType="outline" z-dropdown [zDropdownMenu]="menu">Open</button>
 
    <z-dropdown-menu-content #menu="zDropdownMenuContent" class="w-56">
      <z-menu-label>My Account</z-menu-label>
 
      <z-dropdown-menu-item (click)="onProfile()">
        Profile
        <z-menu-shortcut>⇧⌘P</z-menu-shortcut>
      </z-dropdown-menu-item>
 
      <z-dropdown-menu-item (click)="onBilling()">
        Billing
        <z-menu-shortcut>⌘B</z-menu-shortcut>
      </z-dropdown-menu-item>
 
      <z-dropdown-menu-item (click)="onSettings()">
        Settings
        <z-menu-shortcut>⌘S</z-menu-shortcut>
      </z-dropdown-menu-item>
 
      <z-dropdown-menu-item (click)="onKeyboardShortcuts()">
        Keyboard shortcuts
        <z-menu-shortcut>⌘K</z-menu-shortcut>
      </z-dropdown-menu-item>
 
      <z-divider zSpacing="sm" class="-mx-1" />
 
      <z-dropdown-menu-item (click)="onTeam()">Team</z-dropdown-menu-item>
 
      <z-dropdown-menu-item (click)="onNewTeam()">
        New Team
        <z-menu-shortcut>⌘+T</z-menu-shortcut>
      </z-dropdown-menu-item>
 
      <z-divider zSpacing="sm" class="-mx-1" />
 
      <z-dropdown-menu-item (click)="onGitHub()">GitHub</z-dropdown-menu-item>
      <z-dropdown-menu-item (click)="onSupport()">Support</z-dropdown-menu-item>
      <z-dropdown-menu-item disabled="true">API</z-dropdown-menu-item>
 
      <z-divider zSpacing="sm" class="-mx-1" />
 
      <z-dropdown-menu-item (click)="onLogout()">
        Log out
        <z-menu-shortcut>⇧⌘Q</z-menu-shortcut>
      </z-dropdown-menu-item>
    </z-dropdown-menu-content>
  `,
})
export class ZardDropdownDemoComponent {
  onProfile() {
    console.log('Profile clicked');
  }
 
  onBilling() {
    console.log('Billing clicked');
  }
 
  onSettings() {
    console.log('Settings clicked');
  }
 
  onKeyboardShortcuts() {
    console.log('Keyboard shortcuts clicked');
  }
 
  onTeam() {
    console.log('Team clicked');
  }
 
  onNewTeam() {
    console.log('New Team clicked');
  }
 
  onGitHub() {
    console.log('GitHub clicked');
  }
 
  onSupport() {
    console.log('Support clicked');
  }
 
  onLogout() {
    console.log('Log out clicked');
  }
}
 Icon
A versatile icon component that encapsulates lucide-angular's icons with a consistent API and styling, providing an abstraction layer that facilitates future icon library swapping.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardIconComponent } from '../icon.component';
 
@Component({
  selector: 'z-demo-icon-default',
  imports: [ZardIconComponent],
  standalone: true,
  template: `
    <div class="flex items-center gap-4">
      <z-icon zType="house" />
      <z-icon zType="settings" />
      <z-icon zType="user" />
      <z-icon zType="search" />
      <z-icon zType="bell" />
      <z-icon zType="mail" />
    </div>
  `,
})
export class ZardDemoIconDefaultComponent {}
 Kbd
Display keyboard keys and shortcuts in a visually consistent way. Useful for documentation, tooltips, command palettes, and UI hints showing keyboard shortcuts.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardButtonComponent } from '../../button/button.component';
import { ZardKbdComponent } from '../kbd.component';
 
@Component({
  selector: 'z-demo-kbd-default',
  imports: [ZardKbdComponent, ZardButtonComponent],
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center gap-4">
      <div class="flex items-center gap-2">
        <z-kbd>Esc</z-kbd>
        <z-kbd>⌘</z-kbd>
        <z-kbd>Ctrl</z-kbd>
      </div>
 
      <button type="submit" z-button zType="outline">
        Submit
        <z-kbd class="ml-2">Enter</z-kbd>
      </button>
    </div>
  `,
})
export class ZardDemoKbdDefaultComponent {}
 Menu
A versatile menu component built on top of Angular CDK Menu for creating dropdown and context menus.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardDividerComponent } from '@/shared/components/divider';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
 
@Component({
  selector: 'zard-demo-menu-default',
  imports: [ZardMenuImports, ZardButtonComponent, ZardDividerComponent, ZardIconComponent],
  standalone: true,
  template: `
    <nav class="flex items-center justify-between p-4">
      <div class="flex items-center space-x-6">
        <div class="flex items-center space-x-1">
          <div class="relative">
            <button type="button" z-button zType="ghost" z-menu zTrigger="hover" [zMenuTriggerFor]="productsMenu">
              Products
              <z-icon zType="chevron-down" class="ml-1" />
            </button>
 
            <ng-template #productsMenu>
              <div z-menu-content class="w-48">
                <button type="button" z-menu-item (click)="log('Analytics')">Analytics</button>
                <button type="button" z-menu-item (click)="log('Dashboard')">Dashboard</button>
                <button type="button" z-menu-item (click)="log('Reports')">Reports</button>
                <button type="button" z-menu-item zDisabled (click)="log('Insights')">Insights</button>
              </div>
            </ng-template>
          </div>
 
          <div class="relative">
            <button type="button" z-button zType="ghost" z-menu zTrigger="hover" [zMenuTriggerFor]="solutionsMenu">
              Solutions
              <z-icon zType="chevron-down" class="ml-1" />
            </button>
 
            <ng-template #solutionsMenu>
              <div z-menu-content class="w-80 p-2">
                <div class="grid gap-1">
                  <button
                    type="button"
                    z-menu-item
                    (click)="log('For Startups')"
                    class="flex h-auto flex-col items-start py-3"
                  >
                    <div class="text-sm font-medium">For Startups</div>
                    <div class="text-muted-foreground mt-1 text-xs">
                      Get started quickly with our startup-friendly tools
                    </div>
                  </button>
 
                  <button
                    type="button"
                    z-menu-item
                    (click)="log('For Enterprise')"
                    class="flex h-auto flex-col items-start py-3"
                  >
                    <div class="text-sm font-medium">For Enterprise</div>
                    <div class="text-muted-foreground mt-1 text-xs">
                      Scale your business with enterprise-grade features
                    </div>
                  </button>
 
                  <button
                    type="button"
                    z-menu-item
                    (click)="log('For Agencies')"
                    class="flex h-auto flex-col items-start py-3"
                  >
                    <div class="text-sm font-medium">For Agencies</div>
                    <div class="text-muted-foreground mt-1 text-xs">Manage multiple clients with our agency tools</div>
                  </button>
                </div>
              </div>
            </ng-template>
          </div>
 
          <div class="relative">
            <button type="button" z-button zType="ghost" z-menu zTrigger="hover" [zMenuTriggerFor]="resourcesMenu">
              Resources
              <z-icon zType="chevron-down" />
            </button>
 
            <ng-template #resourcesMenu>
              <div z-menu-content class="w-56">
                <button type="button" z-menu-item (click)="log('Blog')">
                  <z-icon zType="book-open" class="mr-2" />
                  Blog
                </button>
 
                <button type="button" z-menu-item (click)="log('Documentation')">
                  <z-icon zType="file-text" class="mr-2" />
                  Documentation
                </button>
 
                <button
                  type="button"
                  z-menu-item
                  z-menu
                  [zMenuTriggerFor]="helpSubmenu"
                  zPlacement="rightTop"
                  class="justify-between"
                >
                  <div class="flex items-center">
                    <z-icon zType="info" class="mr-2" />
                    Help & Support
                  </div>
                  <z-icon zType="chevron-right" />
                </button>
 
                <z-divider zSpacing="sm" />
 
                <button type="button" z-menu-item (click)="log('Community')">
                  <z-icon zType="users" class="mr-2" />
                  Community
                </button>
              </div>
            </ng-template>
 
            <ng-template #helpSubmenu>
              <div z-menu-content class="w-48">
                <button type="button" z-menu-item (click)="log('Getting Started')">Getting Started</button>
                <button type="button" z-menu-item (click)="log('Tutorials')">Tutorials</button>
                <button type="button" z-menu-item (click)="log('FAQ')">FAQ</button>
 
                <z-divider zSpacing="sm" />
 
                <button type="button" z-menu-item (click)="log('Contact Support')">Contact Support</button>
                <button type="button" z-menu-item (click)="log('Live Chat')">Live Chat</button>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </nav>
  `,
})
export class ZardDemoMenuDefaultComponent {
  log(item: string) {
    console.log('Navigate to:', item);
  }
}
 Progress Bar
Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.

AI Assist

Previous
Next
Preview
Code
import { ChangeDetectionStrategy, Component } from '@angular/core';
 
import { ZardProgressBarComponent } from '../progress-bar.component';
 
@Component({
  selector: 'z-demo-progress-bar-basic',
  imports: [ZardProgressBarComponent],
  template: `
    <z-progress-bar [progress]="50" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZardDemoProgressBarBasicComponent {}
 Segmented Control
A set of two or more segments, each of which functions as a mutually exclusive button. Based on shadcn/ui's Tabs component pattern, providing a clean way to create toggle controls with single selection.

AI Assist

Previous
Next
Preview
Code
import { ChangeDetectionStrategy, Component } from '@angular/core';
 
import { ZardSegmentedComponent } from '../segmented.component';
 
@Component({
  selector: 'zard-demo-segmented-default',
  imports: [ZardSegmentedComponent],
  standalone: true,
  template: `
    <z-segmented [zOptions]="options" zDefaultValue="all" (zChange)="onSelectionChange($event)" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZardDemoSegmentedDefaultComponent {
  options = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'archived', label: 'Archived' },
  ];
 
  onSelectionChange(value: string) {
    console.log('Selected:', value);
  }
}
 Skeleton
Use to show a placeholder while content is loading.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardSkeletonComponent } from '../skeleton.component';
 
@Component({
  selector: 'z-demo-skeleton-default',
  imports: [ZardSkeletonComponent],
  standalone: true,
  template: `
    <div class="flex items-center space-x-4">
      <z-skeleton class="h-12 w-12 rounded-full" />
      <div class="space-y-2">
        <z-skeleton class="h-4 w-[250px]" />
        <z-skeleton class="h-4 w-[200px]" />
      </div>
    </div>
  `,
})
export class ZardDemoSkeletonDefaultComponent {}
 Table
Displays data in a structured table format with styling variants and semantic HTML structure.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardTableComponent } from '../table.component';
 
interface Person {
  key: string;
  name: string;
  age: number;
  address: string;
}
 
@Component({
  selector: 'z-demo-table-simple',
  imports: [ZardTableComponent],
  standalone: true,
  template: `
    <table z-table>
      <caption>A list of your recent invoices.</caption>
      <thead>
        <tr>
          <th>Name</th>
          <th>Age</th>
          <th>Address</th>
        </tr>
      </thead>
      <tbody>
        @for (data of listOfData; track data.key) {
          <tr>
            <td class="font-medium">{{ data.name }}</td>
            <td>{{ data.age }}</td>
            <td>{{ data.address }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class ZardDemoTableSimpleComponent {
  listOfData: Person[] = [
    {
      key: '1',
      name: 'John Brown',
      age: 32,
      address: 'New York No. 1 Lake Park',
    },
    {
      key: '2',
      name: 'Jim Green',
      age: 42,
      address: 'London No. 1 Lake Park',
    },
    {
      key: '3',
      name: 'Joe Black',
      age: 32,
      address: 'Sidney No. 1 Lake Park',
    },
  ];
}
 Toggle
A two-state button that can be either on or off.

AI Assist

Previous
Next
Preview
Code
import { Component } from '@angular/core';
 
import { ZardIconComponent } from '../../icon/icon.component';
import { ZardToggleComponent } from '../toggle.component';
 
@Component({
  selector: 'z-demo-toggle-default',
  imports: [ZardToggleComponent, ZardIconComponent],
  standalone: true,
  template: `
    <z-toggle aria-label="Default toggle">
      <z-icon zType="bold" />
    </z-toggle>
  `,
})
export class ZardDemoToggleDefaultComponent {}
 