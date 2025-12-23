/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-21T22:44:14
 * Last Updated: 2025-12-21T22:44:16
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Script to add default permissions for ABAC testing
 */
import { db } from './src/infrastructure/database/connection.ts';
import { permissions } from './src/infrastructure/database/schema.ts';

async function addDefaultPermissions() {
  try {
    console.log('Adding default permissions...');

    const defaultPermissions = [
      {
        resource: 'license',
        action: 'read',
        conditions: null,
        description: 'Read license information',
      },
      {
        resource: 'license',
        action: 'create',
        conditions: null,
        description: 'Create new licenses',
      },
      {
        resource: 'user',
        action: 'read',
        conditions: null,
        description: 'Read user profile',
      },
    ];

    for (const perm of defaultPermissions) {
      await db.insert(permissions).values({
        resource: perm.resource,
        action: perm.action,
        conditions: perm.conditions,
        description: perm.description,
        isSystemPermission: true,
      }).onConflictDoNothing();
      console.log(`Added permission: ${perm.resource}:${perm.action}`);
    }

    console.log('Default permissions added successfully!');
  } catch (error) {
    console.error('Error adding permissions:', error);
  } finally {
    process.exit(0);
  }
}

addDefaultPermissions();