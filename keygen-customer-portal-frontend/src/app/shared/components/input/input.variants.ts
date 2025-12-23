/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T10:03:36
 * Last Updated: 2025-12-22T00:58:15
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

export const inputVariants = {
  variant: {
    default: '',
  },
  size: {
    default: '',
    sm: 'h-8',
    lg: 'h-11',
  },
};

// Alias for backward compatibility
export type ZardInputSizeVariants = keyof typeof inputVariants.size;
