/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-23T02:28:39
 * Last Updated: 2025-12-23T02:28:39
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { cva, type VariantProps } from 'class-variance-authority';

export const alertDialogVariants = cva(
  'fixed z-50 w-full max-w-[calc(100%-2rem)] border bg-background shadow-lg rounded-lg sm:max-w-lg'
);

export type ZardAlertDialogVariants = VariantProps<typeof alertDialogVariants>;
