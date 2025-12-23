# Angular Grid System

Мощная система сеток для Angular на базе CSS Grid и Angular CDK Layout.

## Особенности

- ✅ **CSS Grid** - современная технология сеток
- ✅ **Responsive** - автоматическая адаптация под экраны
- ✅ **Angular CDK** - интеграция с breakpoint observer
- ✅ **Type-safe** - полная типизация TypeScript
- ✅ **Lightweight** - минимальный размер бандла
- ✅ **Flexible** - поддержка spanning и custom layouts

## Установка

Компоненты уже установлены в проекте. Просто импортируйте нужные компоненты:

```typescript
import { GridComponent, GridItemComponent, GridService } from './shared/grid';
```

## Использование

### Базовая сетка

```html
<app-grid [cols]="3" gap="1rem">
  <app-grid-item>
    <div>Column 1</div>
  </app-grid-item>
  <app-grid-item>
    <div>Column 2</div>
  </app-grid-item>
  <app-grid-item>
    <div>Column 3</div>
  </app-grid-item>
</app-grid>
```

### Responsive сетка

```html
<app-grid [responsive]="true" gap="1rem">
  <app-grid-item>
    <div>Item 1 (адаптивная ширина)</div>
  </app-grid-item>
  <app-grid-item>
    <div>Item 2</div>
  </app-grid-item>
  <!-- Автоматически: 1 колонка на mobile, 2 на tablet, 3 на desktop, 4 на large -->
</app-grid>
```

### Сетка с spanning

```html
<app-grid [cols]="12" gap="1rem">
  <app-grid-item [span]="6">
    <div>Ширина 6 колонок</div>
  </app-grid-item>
  <app-grid-item [span]="3">
    <div>Ширина 3 колонки</div>
  </app-grid-item>
  <app-grid-item [span]="3">
    <div>Ширина 3 колонки</div>
  </app-grid-item>
</app-grid>
```

## API

### GridComponent

| Свойство | Тип | По умолчанию | Описание |
|----------|-----|-------------|----------|
| `cols` | `number` | `1` | Количество колонок |
| `gap` | `string` | `'1rem'` | Расстояние между элементами |
| `responsive` | `boolean` | `false` | Включить responsive поведение |

### GridItemComponent

| Свойство | Тип | По умолчанию | Описание |
|----------|-----|-------------|----------|
| `span` | `number` | `1` | Сколько колонок занимает элемент |
| `start` | `number \| null` | `null` | Начальная позиция (CSS Grid line) |
| `end` | `number \| null` | `null` | Конечная позиция (CSS Grid line) |

### GridService

Сервис для работы с responsive breakpoints:

```typescript
export class MyComponent {
  constructor(private gridService: GridService) {}

  ngOnInit() {
    // Текущий breakpoint
    this.gridService.getCurrentBreakpoint().subscribe(bp => {
      console.log('Current breakpoint:', bp); // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    });

    // Оптимальное количество колонок
    this.gridService.getOptimalColumns().subscribe(cols => {
      console.log('Optimal columns:', cols);
    });

    // Проверка типа устройства
    this.gridService.isMobile().subscribe(isMobile => {
      console.log('Is mobile:', isMobile);
    });
  }
}
```

## Breakpoints

| Breakpoint | Размер экрана | Колонки |
|------------|---------------|---------|
| `xs` | < 600px | 1 |
| `sm` | 600px - 959px | 2 |
| `md` | 960px - 1279px | 3 |
| `lg` | 1280px - 1919px | 4 |
| `xl` | >= 1920px | 6 |

## Примеры

### Карточная сетка
```html
<app-grid [responsive]="true" gap="1.5rem">
  <app-grid-item *ngFor="let card of cards">
    <div class="card">{{ card.title }}</div>
  </app-grid-item>
</app-grid>
```

### Dashboard layout
```html
<app-grid [cols]="12" gap="2rem">
  <!-- Header -->
  <app-grid-item [span]="12">
    <header>...</header>
  </app-grid-item>

  <!-- Sidebar -->
  <app-grid-item [span]="3">
    <nav>...</nav>
  </app-grid-item>

  <!-- Content -->
  <app-grid-item [span]="9">
    <main>...</main>
  </app-grid-item>
</app-grid>
```

### Форма с полями
```html
<app-grid [cols]="2" gap="1rem">
  <app-grid-item>
    <input placeholder="First Name">
  </app-grid-item>
  <app-grid-item>
    <input placeholder="Last Name">
  </app-grid-item>
  <app-grid-item [span]="2">
    <textarea placeholder="Bio"></textarea>
  </app-grid-item>
</app-grid>
```

## Преимущества перед альтернативами

| Функция | Наша система | Angular Flex Layout | CSS Classes | Bootstrap Grid |
|---------|--------------|---------------------|-------------|----------------|
| CSS Grid | ✅ | ❌ | ✅ | ❌ |
| Responsive | ✅ | ✅ | ❌ | ✅ |
| Type-safe | ✅ | ❌ | ❌ | ❌ |
| Tree-shakable | ✅ | ✅ | ❌ | ❌ |
| Angular CDK | ✅ | ❌ | ❌ | ❌ |
| Bundle size | ~5KB | ~50KB | 0KB | ~20KB |

## Советы по оптимизации

1. **Используйте responsive режим** для автоматической адаптации
2. **Избегайте глубокого nesting** - максимум 2-3 уровня
3. **Используйте span** вместо custom CSS для spanning
4. **Комбинируйте с Tailwind** для styling элементов внутри grid

## Troubleshooting

### Элементы не выстраиваются в ряд
```typescript
// Решение: проверьте cols
<app-grid [cols]="3"> // Должно быть достаточно колонок
```

### Не работает responsive
```typescript
// Решение: включите responsive
<app-grid [responsive]="true">
```

### Неправильные отступы
```typescript
// Решение: настройте gap
<app-grid gap="2rem">
```