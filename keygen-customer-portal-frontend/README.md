# Keygen Customer Portal Frontend

A modern, enterprise-grade Angular application built with hexagonal domain-driven design architecture. This customer portal features comprehensive authentication, user management, theming, and monitoring capabilities.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/pnpm
- Angular CLI 21+

### Installation
```bash
cd keygen-customer-portal-frontend
pnpm install
```

### Development Server
```bash
pnpm start
```
Navigate to `http://localhost:4200/`. The app will automatically reload on file changes.

### Build for Production
```bash
pnpm run build
```

## 🏗️ Architecture & Tech Stack

This application follows **Hexagonal Domain-Driven Design (DDD)** principles with a modern Angular stack.

### Architecture Layers
- **Domain Layer**: Core business logic and entities (`src/app/domain/`)
- **Application Layer**: Use cases and services (`src/app/application/`)
- **Infrastructure Layer**: External concerns and implementations (`src/app/infrastructure/`)
- **Shared Components**: Reusable UI components (`src/app/shared/`)

### Core Technologies

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | Angular | 21.0.0 | Main application framework |
| **Language** | TypeScript | 5.9.3 | Type-safe JavaScript |
| **Build System** | Angular CLI | 21.0.4 | Development and build tooling |
| **Build Tool** | Vite | via Angular 21 | Fast development server |
| **Package Manager** | pnpm | 10.26.0 | Dependency management |

### Styling & UI

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 3.4.13 | Utility-first CSS framework |
| **PostCSS** | 8.5.6 | CSS processing |
| **Autoprefixer** | 10.4.23 | CSS vendor prefixes |
| **Angular CDK** | 21.0.5 | UI component primitives |
| **NG Icons** | 31.4.0 + 32.0.0 | Icon system (Lucide) |
| **Embla Carousel** | 21.0.0 | Carousel/slider components |

### Testing Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vitest** | 4.0.8 | Fast unit testing framework |
| **Playwright** | 1.57.0 | End-to-end testing |
| **JSDOM** | 27.1.0 | DOM environment for Vitest |

### Code Quality & Linting

| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | 9.39.1 | JavaScript/TypeScript linting |
| **Angular ESLint** | 21.1.0 | Angular-specific rules |
| **TypeScript ESLint** | 8.47.0 | TypeScript linting rules |
| **Stylelint** | latest | CSS linting |
| **Prettier** | 3.7.4 | Code formatting |
| **Husky** | 9.1.7 | Git hooks |
| **lint-staged** | 16.2.7 | Pre-commit linting |

### Additional Libraries

| Technology | Version | Purpose |
|------------|---------|---------|
| **RxJS** | 7.8.0 | Reactive programming |
| **Zone.js** | 0.16.0 | Angular change detection |
| **ngx-translate** | 17.0.0 | Internationalization |
| **ngx-sonner** | 3.1.0 | Toast notifications |
| **Class Variance Authority** | 0.7.0 | Component variants |
| **CLSX** | 2.1.1 | Conditional CSS classes |
| **Tailwind Merge** | 2.5.2 | CSS class merging |

### Monitoring & Analysis

| Technology | Version | Purpose |
|------------|---------|---------|
| **MicroSentry Angular** | 7.2.0 | Error tracking & monitoring |
| **Hex DDD Analyzer** | custom | Architecture compliance analysis |
| **Compodoc** | 1.1.32 | Documentation generation |

### Development Tools
- **Hot Module Replacement** (via Vite)
- **Source Maps** for debugging
- **TypeScript Path Mapping** (`@/*` aliases)
- **CSS Custom Properties** for theming
- **Tree-shakable builds** for optimal bundle size

## 🎨 Design System

### Tailwind CSS + Custom Themes
- **Utility-first styling** with Tailwind CSS
- **Dark/Light theme support** with CSS custom properties
- **Office-themed color palette** (professional blues, grays, and slates)
- **Responsive design** with mobile-first approach

### Key Features
- Theme switching (light/dark modes)
- Internationalization (English, Spanish, Russian)
- Comprehensive component library (60+ components)
- Accessible UI components following WCAG guidelines

## 🧪 Testing

### Unit Tests (Vitest)
```bash
pnpm test
```

### E2E Tests (Playwright)
```bash
# Setup browsers
pnpm run e2e:setup

# Run all tests
pnpm run e2e

# Run specific test suites
pnpm run e2e:auth        # Authentication tests
pnpm run e2e:protected   # Protected routes tests
pnpm run e2e:ui          # Visual testing UI
```

**E2E Features:**
- Session persistence between tests
- Cross-browser testing (Chrome, Firefox, Safari, Mobile)
- Authentication flow testing
- Protected route validation

## 🔧 Development Tools

### CSS Management
```bash
# Build and purge CSS
pnpm run css:build-and-copy

# Watch mode for development
pnpm run css:watch

# Generate CSS documentation
pnpm run generate-css
```

### Code Quality
```bash
# Lint and format code
pnpm run lint
pnpm run format

# Pre-commit hooks (Husky + lint-staged)
pnpm run prepare
```

### Architecture Analysis
```bash
# Analyze hexagonal DDD compliance
pnpm run hex-ddd-analyze

# Generate documentation
pnpm run docs:build
pnpm run docs:serve
```

### Debugging Tools
```bash
# Debug logging
pnpm run debug:log

# Rollback debug changes
pnpm run debug:rollback
```

## 📊 Monitoring & Error Tracking

### MicroSentry Integration
- **Automatic error capture** with full stack traces
- **User context tracking** (session, user data, form state)
- **Performance monitoring** and breadcrumbs
- **Production error reporting** with source maps

### Architecture Dumping
```bash
# Analyze component tree
pnpm run arho
```

## 🌐 Internationalization

Supports multiple languages with ngx-translate:
- English (`en.json`)
- Spanish (`es.json`)
- Russian (`ru.json`)

## 📱 Features

### Authentication & Security
- User registration and login
- Session management
- Protected routes with guards
- Password change functionality
- JWT-based authentication

### User Management
- User profile management
- Session tracking
- Theme preferences
- Language selection

### UI Components Library
- 60+ reusable components (buttons, forms, dialogs, etc.)
- Consistent design system
- Theme-aware styling
- Accessibility compliant

## 🛠️ Scripts Overview

| Command | Description |
|---------|-------------|
| `pnpm start` | Start development server |
| `pnpm build` | Build for production |
| `pnpm test` | Run unit tests |
| `pnpm lint` | Lint code |
| `pnpm format` | Format code |
| `pnpm e2e` | Run E2E tests |
| `pnpm css:build-and-copy` | Build and optimize CSS |
| `pnpm docs:build` | Generate documentation |
| `pnpm hex-ddd-analyze` | Analyze DDD compliance |
| `pnpm arho` | Architecture analysis |

## 📚 Documentation

- [Design System Guide](./Design.md) - Styling and theming
- [Office Colors](./OFFICE_COLORS.md) - Color palette reference
- [Playwright Tests](./PLAYWRIGHT_TESTS_README.md) - E2E testing guide
- [Monitoring Setup](./MONITORING_SETUP.md) - Error tracking and monitoring
- [CSS Generation](./CONFIG_CSS_GENERATION.md) - CSS build process
- [Error Handler](./ERROR_HANDLER_README.md) - Error handling system

## 🤝 Contributing

1. Follow the hexagonal DDD architecture
2. Use the established design system and components
3. Write tests for new features
4. Run `pnpm run lint` and `pnpm run format` before committing
5. Update documentation as needed

## 📄 License

This project is part of the Keygen Customer Portal system.

---

Built with ❤️ using Angular 21, Tailwind CSS, and modern web technologies.
