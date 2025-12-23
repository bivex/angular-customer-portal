/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-23T02:28:37
 * Last Updated: 2025-12-23T02:28:37
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { cva, type VariantProps } from 'class-variance-authority';

export const loaderVariants = cva('', {
  variants: {
    zSize: {
      default: 'size-6',
      sm: 'size-4',
      lg: 'size-8',
    },
  },
  defaultVariants: {
    zSize: 'default',
  },
});
export type ZardLoaderVariants = VariantProps<typeof loaderVariants>;
