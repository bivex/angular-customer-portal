/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T19:56:25
 * Last Updated: 2025-12-23T02:28:25
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import SwaggerParser from 'swagger-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function validateOpenAPI() {
  const yamlFile = path.join(__dirname, 'openapi.yaml');
  const jsonFile = path.join(__dirname, 'openapi.json');

  console.log('🔍 Validating OpenAPI specifications...\n');

  try {
    // Validate YAML
    console.log('📄 Validating openapi.yaml...');
    const yamlApi = await SwaggerParser.validate(yamlFile);
    console.log('✅ openapi.yaml is valid!');
    console.log(`   Title: ${yamlApi.info.title}`);
    console.log(`   Version: ${yamlApi.info.version}`);
    console.log(`   Endpoints: ${Object.keys(yamlApi.paths).length}`);

    // Validate JSON
    console.log('\n📄 Validating openapi.json...');
    const jsonApi = await SwaggerParser.validate(jsonFile);
    console.log('✅ openapi.json is valid!');
    console.log(`   Title: ${jsonApi.info.title}`);
    console.log(`   Version: ${jsonApi.info.version}`);
    console.log(`   Endpoints: ${Object.keys(jsonApi.paths).length}`);

    // Check if they match
    console.log('\n🔍 Checking consistency between YAML and JSON...');
    if (JSON.stringify(yamlApi) === JSON.stringify(jsonApi)) {
      console.log('✅ YAML and JSON specifications are identical!');
    } else {
      console.log('⚠️  YAML and JSON specifications differ!');
    }

    console.log('\n🎉 All validations passed!');

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    process.exit(1);
  }
}

validateOpenAPI();