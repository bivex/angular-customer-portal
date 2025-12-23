# Технологический стек проекта Keygen Customer Portal

## Обзор проекта

Keygen Customer Portal - это полнофункциональный веб-приложение с микросервисной архитектурой, состоящее из бэкенда, фронтенда и вспомогательных сервисов.

## Архитектура

### Микросервисная архитектура
- **Backend Service**: REST API сервер (keygen-customer-portal-backend)
- **Frontend Service**: Angular веб-приложение (keygen-customer-portal-frontend)
- **Micro-sentry Service**: Sentry интеграция для Angular (micro-sentry)
- **Angular Core**: Официальный Angular репозиторий для разработки

---

## Backend (keygen-customer-portal-backend)

### Runtime & Framework
- **Bun** 1.x - JavaScript runtime (замена Node.js)
- **Elysia.js** 1.4.19 - Фреймворк для веб-серверов (замена Express.js)

### Язык и типизация
- **TypeScript** 5.9.3 - Основной язык разработки
- **Zod** 4.2.1 - Схема валидации и типизации

### База данных
- **PostgreSQL** - Реляционная база данных
- **Drizzle ORM** 0.45.1 - Type-safe ORM для TypeScript
- **Drizzle Kit** 0.31.8 - Миграции и генерация схем
- **postgres** 3.4.7 - PostgreSQL клиент

### Аутентификация & Авторизация
- **jsonwebtoken** 9.0.3 - JWT токены
- **jwks-rsa** 3.2.0 - JWKS (JSON Web Key Set) для RS256
- **bcrypt** 6.0.0 - Хэширование паролей

### Безопасность
- **@sentry/bun** 10.32.0 - Мониторинг ошибок для Bun
- **@sentry/node** 10.32.0 - Мониторинг ошибок для Node.js
- **@spotlightjs/spotlight** 4.8.0 - Отладка и мониторинг

### API & Документация
- **@elysiajs/cors** 1.4.0 - CORS middleware
- **@elysiajs/openapi** 1.4.12 - OpenAPI 3.0 документация
- **swagger-parser** 10.0.3 - Валидация OpenAPI спецификаций
- **yaml** 2.8.2 - Работа с YAML файлами

### Логирование & Мониторинг
- **pino** 10.1.0 - Структурированное логирование
- **pino-pretty** 13.1.3 - Форматирование логов

### Конфигурация
- **dotenv** 17.2.3 - Переменные окружения

---

## Frontend (keygen-customer-portal-frontend)

### Framework & Runtime
- **Angular** 21.0.x - Основной фреймворк
- **TypeScript** 5.9.3 - Язык разработки
- **Zone.js** 0.16.0 - Зоны Angular
- **RxJS** 7.8.0 - Reactive programming

### Build Tools & Bundlers
- **Vite** - Быстрый bundler для разработки
- **@angular/build** 21.0.4 - Angular CLI build system
- **@angular/cli** 21.0.4 - Angular CLI

### UI & Styling
- **Tailwind CSS** 3.4.13 - Utility-first CSS framework
- **@angular/cdk** 21.0.5 - Angular Component Dev Kit
- **@angular/animations** 21.0.6 - Angular animations
- **tailwind-merge** 2.5.2 - Утилиты для слияния Tailwind классов
- **tailwindcss-animate** 1.0.7 - Анимации для Tailwind
- **tw-animate-css** 1.4.0 - CSS анимации
- **class-variance-authority** 0.7.0 - Управление вариантами компонентов
- **clsx** 2.1.1 - Условные CSS классы

### Icons & UI Components
- **@ng-icons/core** 31.4.0 - Angular иконки
- **@ng-icons/lucide** 32.0.0-34.0.0 - Lucide иконки
- **lucide-angular** 0.562.0 - Angular интеграция Lucide
- **heroicons** 2.2.0 - Heroicons иконки

### Carousel & Interactive Components
- **embla-carousel-angular** 21.0.0 - Angular карусель
- **embla-carousel-autoplay** 8.6.0 - Автопрокрутка карусели
- **embla-carousel-class-names** 8.6.0 - CSS классы карусели
- **embla-carousel-wheel-gestures** 8.1.0 - Жесты колесика мыши

### Интернационализация
- **@ngx-translate/core** 17.0.0 - Angular i18n
- **@ngx-translate/http-loader** 17.0.0 - HTTP загрузчик переводов

### Мониторинг & Отчетность
- **@micro-sentry/angular** 7.2.0 - Sentry интеграция для Angular
- **ngx-sonner** 3.1.0 - Toast уведомления

### Качество кода & Линтинг
- **ESLint** 9.39.1 - JavaScript/TypeScript линтер
- **@angular-eslint/builder** 21.1.0 - Angular ESLint правила
- **angular-eslint** 21.1.0 - Angular-специфичный ESLint
- **typescript-eslint** 8.47.0 - TypeScript ESLint правила
- **@eslint/js** 9.39.1 - ESLint конфигурация
- **stylelint** 16.26.1 - CSS линтер
- **stylelint-config-standard** 39.0.1 - Стандартная конфигурация Stylelint
- **stylelint-config-tailwindcss** 1.0.0 - Tailwind CSS правила

### Форматирование кода
- **Prettier** 3.7.4 - Код форматирование

### Тестирование
- **Vitest** 4.0.8 - Unit тестирование (быстрее Jest)
- **Playwright** 1.57.0 - E2E тестирование
- **jsdom** 27.1.0 - DOM эмуляция для тестов

### Git Hooks & Automation
- **Husky** 9.1.7 - Git hooks
- **lint-staged** 16.2.7 - Запуск линтеров на staged файлах

### Build Tools
- **Autoprefixer** 10.4.23 - CSS префиксы
- **PostCSS** 8.5.6 - CSS постпроцессинг

### Документация
- **@compodoc/compodoc** 1.1.32 - Angular документация

### Кастомные инструменты
- **hex-ddd-analyzer** - Анализатор DDD архитектуры

---

## Micro-sentry Service

### Framework
- **Angular** 16.2.x - Для создания Angular библиотеки
- **TypeScript** 5.1.3 - Язык разработки

### Build Tools
- **ng-packagr** 16.2.0 - Пакетирование Angular библиотек
- **@angular-devkit/build-angular** 16.2.3 - Build system

### Тестирование
- **Jasmine** 4.6.0 - Тестовый фреймворк
- **Karma** 6.4.0 - Test runner
- **karma-chrome-launcher** 3.2.0 - Chrome браузер для тестов
- **karma-coverage** 2.2.0 - Покрытие кода
- **karma-jasmine** 5.1.0 - Jasmine адаптер для Karma
- **karma-jasmine-html-reporter** 2.1.0 - HTML отчеты

### HTTP & Web APIs
- **@ng-web-apis/common** 3.0.3 - Web APIs для Angular

---

## Development & DevOps Tools

### Package Managers
- **Bun** - Основной менеджер пакетов для backend
- **pnpm** 10.26.0 - Менеджер пакетов для frontend
- **npm** - Fallback менеджер пакетов

### Development Scripts
- **Custom dev-server.sh** - Управление разработческими серверами
- **Port management** - Автоматическое управление портами (backend: 3000, frontend: 4200)

### Database Management
- **Drizzle migrations** - Управление схемой БД
- **Environment setup scripts** - setup-env.sh, setup-keys.sh

### Quality Assurance
- **OpenAPI validation** - validate-openapi.js
- **Edge case testing** - test-edge-cases.js
- **Refresh token testing** - test-refresh-token-integration.js
- **Default permissions setup** - add-default-permissions.js

---

## Production & Deployment

### Containerization
- **Docker** (предполагается по структуре проекта)

### Environment Management
- **Environment variables** - Безопасная конфигурация
- **Security environment setup** - setup-env.sh с валидацией

### Monitoring & Observability
- **Sentry** - Error tracking и monitoring
- **Health checks** - Встроенные эндпоинты /health
- **Performance monitoring** - Метрики и логирование

---

## Архитектурные паттерны

### Backend
- **Domain-Driven Design (DDD)** - Бизнес-логика в домене
- **Hexagonal Architecture** - Порты и адаптеры
- **CQRS** - Command Query Responsibility Segregation
- **Repository Pattern** - Абстракция доступа к данным
- **Dependency Injection** - Управление зависимостями

### Frontend
- **Component Architecture** - Angular компоненты
- **Reactive Programming** - RxJS для асинхронности
- **Atomic Design** - Переиспользуемые UI компоненты
- **Feature Modules** - Модульная архитектура

### Security
- **Attribute-Based Access Control (ABAC)** - Тонкая настройка прав
- **Risk Assessment Engine** - Оценка рисков в реальном времени
- **JWT with RS256** - Современная аутентификация
- **Session Management** - Управление пользовательскими сессиями

---

## Version Matrix

| Component | Version | Notes |
|-----------|---------|-------|
| Angular | 21.0.x | Latest stable |
| TypeScript | 5.9.3 | Latest stable |
| Bun | 1.x | Modern runtime |
| Elysia.js | 1.4.19 | Modern web framework |
| PostgreSQL | Latest | Production database |
| Tailwind CSS | 3.4.13 | Latest stable |
| Playwright | 1.57.0 | E2E testing |
| Vitest | 4.0.8 | Unit testing |

---

## Development Workflow

1. **Backend**: `bun run dev` (порт 3000)
2. **Frontend**: `pnpm start` (порт 4200)
3. **Testing**: `pnpm test` (unit), `pnpm e2e` (e2e)
4. **Linting**: `pnpm lint` + `pnpm format`
5. **Documentation**: `pnpm docs:build`

---

## Performance Optimizations

- **Vite** для быстрой разработки frontend
- **Bun** для быстрого runtime backend
- **Tree shaking** в Angular build
- **Lazy loading** модулей
- **Service worker** для кэширования
- **Optimized bundles** через Vite

---

*Последнее обновление: декабрь 2025*
