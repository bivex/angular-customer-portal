# Extended Palette Demo - Angular Frontend

Расширенная палитра `pastel-analogous-2` теперь доступна в Angular приложении!

## Что добавлено

### 🎨 Полная цветовая система
- Основная шкала цветов (50-950)
- UI состояния (hover, active, focus, disabled)
- Варианты палитры (light, dark, accent)
- Градиенты (primary, secondary, accent, subtle)
- Тени (sm, base, md, lg, xl)
- Прозрачности (10%-90% alpha)

### 🖥️ Демонстрационная страница
Доступна по адресу: `http://localhost:4204/palette-demo`

### 📋 Доступные классы

#### Основные цвета
```css
bg-pastel-analogous-2-500
text-pastel-analogous-2-700
border-pastel-analogous-2-300
```

#### UI состояния
```css
hover:bg-pastel-analogous-2-ui-hover-500
focus:bg-pastel-analogous-2-ui-focus-500
active:bg-pastel-analogous-2-ui-active-500
disabled:bg-pastel-analogous-2-ui-disabled-500
```

#### Варианты
```css
bg-pastel-analogous-2-light-400
bg-pastel-analogous-2-dark-600
bg-pastel-analogous-2-accent-500
```

#### Градиенты
```css
bg-pastel-analogous-2-gradient-primary
bg-pastel-analogous-2-gradient-secondary
bg-pastel-analogous-2-gradient-accent
bg-pastel-analogous-2-gradient-subtle
```

#### Тени
```css
shadow-pastel-analogous-2-sm
shadow-pastel-analogous-2-base
shadow-pastel-analogous-2-md
shadow-pastel-analogous-2-lg
shadow-pastel-analogous-2-xl
```

#### Прозрачности
```css
bg-pastel-analogous-2-alpha-10
bg-pastel-analogous-2-alpha-20
bg-pastel-analogous-2-alpha-30
bg-pastel-analogous-2-alpha-40
bg-pastel-analogous-2-alpha-50
bg-pastel-analogous-2-alpha-60
bg-pastel-analogous-2-alpha-70
bg-pastel-analogous-2-alpha-80
bg-pastel-analogous-2-alpha-90
```

## Примеры использования

### Кнопка с состояниями
```html
<button class="
  bg-pastel-analogous-2-500
  text-white
  px-4 py-2
  rounded
  hover:bg-pastel-analogous-2-ui-hover-500
  focus:bg-pastel-analogous-2-ui-focus-500
  disabled:bg-pastel-analogous-2-ui-disabled-500
">
  Button
</button>
```

### Карточка с градиентом
```html
<div class="
  bg-pastel-analogous-2-gradient-primary
  p-6
  rounded-lg
  shadow-pastel-analogous-2-lg
  text-white
">
  <h3>Card Title</h3>
  <p class="text-pastel-analogous-2-100">Card content</p>
</div>
```

### Поле ввода с фокусом
```html
<input class="
  bg-pastel-analogous-2-50
  border-pastel-analogous-2-300
  focus:bg-pastel-analogous-2-ui-focus-50
  focus:border-pastel-analogous-2-ui-focus-500
  px-3 py-2 rounded
" placeholder="Input field">
```

### Полупрозрачный оверлей
```html
<div class="
  bg-pastel-analogous-2-alpha-50
  backdrop-blur-sm
  p-4 rounded
">
  <p class="text-pastel-analogous-2-900">Semi-transparent overlay</p>
</div>
```

## Запуск

```bash
cd keygen-customer-portal-frontend
npm run start -- --port 4204
```

Затем откройте браузер и перейдите к: `http://localhost:4204/palette-demo`

## Навигация

Ссылка на демонстрацию палитры добавлена в боковое меню под названием "Palette Demo".