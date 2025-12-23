# Design System and Styling Guide

This document provides an overview of how styling and themes are implemented in the `keygen-customer-portal-frontend` project. It's designed to help newcomers understand the core concepts and best practices.

## 1. Technologies Used

- **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs.
- **CSS Variables (Custom Properties)**: Used for defining and managing theme-specific colors and other design tokens.
- **Angular (for component-specific styling)**: While Tailwind is primary, Angular's component styles can be used for encapsulation when necessary.

## 2. Core Concepts

### 2.1. Tailwind CSS Utility Classes

Tailwind CSS is the primary method for styling components. Instead of writing custom CSS, we compose designs directly in our HTML/templates using utility classes.

**Example:**

```html
<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
  My Button
</button>
```

### 2.2. CSS Variables for Theming

The project implements a dark/light theme system using CSS variables. This allows us to define a set of design tokens (colors, borders, etc.) that can be easily switched by changing a single class on the `<html>` element.

The main CSS variables are defined in `src/styles.css` within the `:root` (light theme) and `.dark` (dark theme) selectors.

**Example from `src/styles.css`:**

```css
/* Light Theme */
:root {
  --background: oklch(0.924 0.037 278.99); /* OKLCH values: lightness chroma hue */
  --foreground: oklch(0.275 0.123 261.5);
  /* ... other variables ... */
}

/* Dark Theme */
.dark {
  --background: 240 10% 3.9%; /* HSL values for dark theme */
  --foreground: 0 0% 98%;
  /* ... other variables ... */
}
```

These variables are then consumed by Tailwind CSS using the `oklch(var(--variable-name))` syntax in `tailwind.config.js`.

**Example from `tailwind.config.js`:**

```javascript
module.exports = {
  // ...
  theme: {
    extend: {
      colors: {
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary))",
          foreground: "oklch(var(--primary-foreground))",
        },
        // ...
      },
    },
  },
  // ...
};
```

This setup ensures that when the `.dark` class is applied to the `<html>` element, the CSS variables change, and Tailwind automatically picks up the new values, effectively switching the theme.

### 2.3. Theme Switching Logic

The theme is typically switched by toggling the `dark` class on the `<html>` element using JavaScript.

**Example from `theme-showcase.component.ts`:**

```typescript
toggleTheme(): void {
  this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.classList.remove('light', 'dark'); // Remove both to prevent issues
  document.documentElement.classList.add(this.currentTheme);   // Add current theme
}
```

It's crucial to ensure that the `document.documentElement.classList` is synchronized with the `currentTheme` state in your component.

## 3. How to Add New Styles or Theme Colors

1.  **For new utility classes (e.g., margins, paddings, flexbox, grid):**
    Simply use the existing Tailwind CSS classes directly in your templates. Refer to the [Tailwind CSS documentation](https://tailwindcss.com/docs) for available utilities.

2.  **For new theme-aware colors:**
    *   **Define CSS variables:** Add new `--your-color-name` variables to both `:root` and `.dark` blocks in `src/styles.css`. Use OKLCH format for light theme (e.g., `oklch(0.924 0.037 278.99)`) and HSL format for dark theme (e.g., `240 10% 3.9%`).
    *   **Extend `tailwind.config.js`:** Add your new color to the `theme.extend.colors` section in `tailwind.config.js`, using `oklch(var(--your-color-name))` as the value for OKLCH variables and `hsl(var(--your-color-name))` for HSL variables.
    *   **Rebuild CSS:** Run `npm run css:build-and-copy` in the `keygen-customer-portal-frontend` directory to regenerate `src/tailwind-generated.css`.
    *   **Use in templates:** You can now use classes like `text-your-color-name`, `bg-your-color-name`, etc., in your templates.

3.  **For component-specific styles:**
    If a component requires very specific styles that cannot be achieved efficiently with Tailwind utility classes or theme variables, you can use Angular's component-scoped styles (e.g., `component.css` files associated with a component). However, this should be a last resort to maintain consistency with the Tailwind approach.

## 4. Development Workflow

1.  **Start the dev server:**
    ```bash
    npm start
    ```
    (Ensure you are in the `keygen-customer-portal-frontend` directory).

2.  **Make changes:** Edit your HTML templates, TypeScript components, or `src/styles.css`/`tailwind.config.js`.

3.  **Rebuild CSS (if `styles.css` or `tailwind.config.js` changed):**
    ```bash
    npm run css:build
    ```
    This command recompiles Tailwind CSS and generates `src/tailwind-generated.css`.

4.  **Refresh browser:** Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R) to ensure the latest CSS is loaded.

## 5. Troubleshooting Common Issues

*   **Themes not switching:**
    *   Ensure `src/styles.css` has correctly defined CSS variables in both `:root` and `.dark` blocks. Light theme uses OKLCH format (`oklch(...)`), dark theme uses HSL format (`H S L%`).
    *   Verify `tailwind.config.js` is correctly mapping these CSS variables to Tailwind colors using `oklch(var(--...))` for OKLCH variables and `hsl(var(--...))` for HSL variables.
    *   Check your component's theme-switching logic to ensure the `dark` class is correctly added/removed from `document.documentElement`.
    *   Always hard refresh your browser after making CSS/Tailwind config changes.
    *   Make sure you've restarted the dev server if `tailwind.config.js` or `styles.css` have been modified substantially.
    *   Rebuild CSS with `npm run css:build-and-copy` which uses the correct input file `src/tailwind-only.css`.

*   **Tailwind classes not applying:**
    *   Check for typos in class names.
    *   Ensure `src/tailwind-generated.css` is being correctly loaded into your application.
    *   Verify that `tailwind.config.js` `content` array includes all paths where you use Tailwind classes.

By following this guide, new developers should be able to quickly understand and contribute to the project's styling and design system.
