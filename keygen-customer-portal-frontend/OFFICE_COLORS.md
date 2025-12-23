# Office Theme Color Palette

## Доступные цветовые палитры

### `office-blue` - Профессиональный синий
Используется для основных элементов интерфейса, кнопок и акцентов.

```css
bg-office-blue-50   /* Светло-синий фон */
bg-office-blue-500  /* Основной синий */
bg-office-blue-700  /* Темный синий для текста */
bg-office-blue-900  /* Очень темный синий */
```

### `office-gray` - Нейтральный серый
Для фонов, текста и разделителей.

```css
bg-office-gray-50    /* Очень светлый серый */
bg-office-gray-100   /* Светлый фон */
bg-office-gray-500   /* Средний серый текст */
bg-office-gray-900   /* Темный текст */
```

### `office-slate` - Темный сланец
Для навигации, боковых панелей и акцентов.

```css
bg-office-slate-50   /* Светлый сланец */
bg-office-slate-800  /* Темный фон навигации */
bg-office-slate-900  /* Очень темный фон */
```

### `office-corporate` - Корпоративный синий
Для брендинга и важных выделений.

```css
bg-office-corporate-500  /* Основной корпоративный цвет */
bg-office-corporate-700  /* Темный вариант */
```

### `office-neutral` - Чистый нейтральный
Для контентных областей и чистого дизайна.

```css
bg-office-neutral-50   /* Белый/очень светлый */
bg-office-neutral-100  /* Светлый фон */
bg-office-neutral-500  /* Средний нейтральный */
```

### `office-professional` - Профессиональный сланец
Для enterprise-приложений.

```css
bg-office-professional-800  /* Профессиональный темный фон */
bg-office-professional-900  /* Очень темный профессиональный */
```

## Градиенты

```css
bg-office-light           /* Светлый офисный градиент */
bg-office-dark            /* Темный офисный градиент */
bg-office-blue-light      /* Синий светлый градиент */
bg-office-blue-dark       /* Синий темный градиент */
bg-office-corporate       /* Корпоративный градиент */
bg-office-neutral         /* Нейтральный градиент */
```

## Тени

```css
shadow-office-blue       /* Синяя офисная тень */
shadow-office-slate      /* Сланцевая офисная тень */
shadow-office-corporate  /* Корпоративная тень */
```

## Примеры использования

```html
<!-- Светлый фон с синими акцентами -->
<div class="bg-office-gray-50">
  <button class="bg-office-blue-500 text-white">Основная кнопка</button>
</div>

<!-- Темная навигация -->
<nav class="bg-office-slate-800 text-office-slate-100">
  <h1 class="text-office-blue-400">Логотип</h1>
</nav>

<!-- Карточка с корпоративным стилем -->
<div class="bg-white border border-office-gray-200 shadow-office-slate">
  <h2 class="text-office-slate-900">Заголовок</h2>
  <p class="text-office-gray-600">Описание</p>
</div>
```

## Рекомендации

- Используйте `office-blue` для основных интерактивных элементов
- `office-gray` для фонов и вторичного текста
- `office-slate` для навигации и боковых панелей
- `office-corporate` для брендинга и важных выделений
- `office-neutral` для чистых контентных областей
- `office-professional` для enterprise-приложений