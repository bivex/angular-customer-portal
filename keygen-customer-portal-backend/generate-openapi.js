#!/usr/bin/env node

/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-20T20:06:35
 * Last Updated: 2025-12-23T02:28:25
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function jsonToYaml(json) {
  return yaml.stringify(json);
}

async function generateOpenAPISpec() {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

  console.log('📄 Generating OpenAPI specification...');
  console.log(`🌐 API Base URL: ${baseUrl}`);

  try {
    // Fetch JSON spec
    const jsonResponse = await fetch(`${baseUrl}/openapi/json`);
    if (!jsonResponse.ok) {
      throw new Error(`Failed to fetch JSON spec: ${jsonResponse.status}`);
    }
    const jsonSpec = await jsonResponse.json();

    // Convert JSON to YAML manually
    const yaml = jsonToYaml(jsonSpec);

    // Write files
    const jsonPath = path.join(__dirname, 'openapi.json');
    const yamlPath = path.join(__dirname, 'openapi.yaml');

    fs.writeFileSync(jsonPath, JSON.stringify(jsonSpec, null, 2));
    fs.writeFileSync(yamlPath, yaml);

    console.log('✅ OpenAPI specification generated successfully!');
    console.log(`   📄 JSON: ${jsonPath}`);
    console.log(`   📄 YAML: ${yamlPath}`);
    console.log(`   📊 Endpoints: ${Object.keys(jsonSpec.paths).length}`);

  } catch (error) {
    console.error('❌ Failed to generate OpenAPI specification:', error.message);
    process.exit(1);
  }
}

generateOpenAPISpec();