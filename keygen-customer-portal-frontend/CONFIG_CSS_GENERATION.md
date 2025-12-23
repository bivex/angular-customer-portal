# Автоматическая генерация CSS из Tailwind

## Обзор
В проекте настроена автоматическая генерация CSS из Tailwind классов с помощью различных скриптов.

## Быстрый старт

```bash
# Простая генерация CSS
npm run generate-css generate

# Генерация только используемых классов
npm run generate-css purge

# Помощь по командам
npm run generate-css help
```

## Доступные скрипты

### Основные скрипты для генерации CSS

```bash
# Генерация полного Tailwind CSS (все классы)
npm run css:generate

# Генерация полного Tailwind CSS (минифицированный)
npm run css:generate:min

# Генерация с отслеживанием изменений
npm run css:generate:watch
```

### Скрипты с очисткой (Purge) - только используемые классы

```bash
# Генерация CSS только с используемыми классами
npm run css:purge

# Генерация CSS только с используемыми классами (минифицированный)
npm run css:purge:min

# Генерация с очисткой и отслеживанием изменений
npm run css:purge:watch
```

### Удобный скрипт для генерации

```bash
# Универсальный скрипт для всех команд генерации
npm run generate-css [command]

# Примеры использования
npm run generate-css generate     # Полный CSS
npm run generate-css purge        # Только используемые классы
npm run generate-css watch        # С отслеживанием изменений
npm run generate-css purge-watch  # Очистка + отслеживание
npm run generate-css minify       # Минифицированный CSS
npm run generate-css help         # Справка
```

### Дополнительные скрипты

```bash
# Генерация CSS из основного styles.css (с кастомными стилями)
npm run css:build

# Генерация CSS из основного styles.css (минифицированный)
npm run css:build:prod

# Генерация CSS из основного styles.css с отслеживанием
npm run css:watch
```

## Файлы

- `src/tailwind-only.css` - входной файл только с Tailwind директивами
- `dist/tailwind-generated.css` - полный сгенерированный CSS
- `dist/tailwind-purged.css` - CSS только с используемыми классами

## Использование в разработке

### Для разработки с отслеживанием:
```bash
npm run css:generate:watch
```

### Для продакшена с очисткой:
```bash
npm run css:purge:min
```

## Интеграция с Angular

CSS генерируется автоматически во время билда Angular через PostCSS. Дополнительная генерация нужна только если вы хотите создать отдельный CSS файл.

## Оптимизация размера

- **Без очистки**: ~42KB (все Tailwind классы)
- **С очисткой**: CSS содержит только классы, используемые в `src/**/*.{html,ts}`

## Примеры использования

```bash
# Разработка
npm run css:generate:watch

# В фоне для автоматической генерации при изменении файлов
npm run css:purge:watch &

# Продакшн билд
npm run css:purge:min
```