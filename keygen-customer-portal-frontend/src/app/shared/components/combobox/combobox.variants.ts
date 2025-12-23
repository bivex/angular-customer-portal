/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-23T02:28:38
 * Last Updated: 2025-12-23T02:28:38
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { cva, type VariantProps } from 'class-variance-authority';

export const comboboxVariants = cva('', {
  variants: {
    zWidth: {
      default: 'w-[200px]',
      sm: 'w-[150px]',
      md: 'w-[250px]',
      lg: 'w-[350px]',
      full: 'w-full',
    },
  },
  defaultVariants: {
    zWidth: 'default',
  },
});

export type ZardComboboxVariants = VariantProps<typeof comboboxVariants>;
