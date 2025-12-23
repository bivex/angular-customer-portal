/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T06:01:06
 * Last Updated: 2025-12-23T02:28:24
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Advanced Angular Architecture Analyzer using ngast
 * Provides comprehensive analysis of Angular projects
 */

const { join } = require('path');
const { WorkspaceSymbols } = require('ngast');

async function analyzeWithNgast() {
  console.log('🔍 Starting advanced Angular architecture analysis with ngast...');

  try {
    // Connect to workspace
    const configPath = join(process.cwd(), 'keygen-customer-portal-frontend', 'tsconfig.json');
    console.log(`📁 Using tsconfig: ${configPath}`);

    const workspace = new WorkspaceSymbols(configPath);

    console.log('⚡ Analyzing workspace (this may take a while for large projects)...');

    // Get all decorated classes
    const modules = workspace.getAllModules();
    const components = workspace.getAllComponents();
    const directives = workspace.getAllDirectives();
    const injectables = workspace.getAllInjectable();
    const pipes = workspace.getAllPipes();

    console.log('✅ Analysis complete!\n');

    // Display results
    console.log('📊 Advanced Architecture Analysis Results:');
    console.log('='.repeat(50));

    console.log(`🏗️  Modules: ${modules.length}`);
    modules.forEach((mod) => {
      console.log(`   - ${mod.name} (${mod.filePath})`);
    });

    console.log(`\n🧩 Components: ${components.length}`);
    components.forEach((comp) => {
      const selector = comp.selector ? ` [${comp.selector}]` : '';
      console.log(`   - ${comp.name}${selector} (${comp.filePath})`);
    });

    console.log(`\n🎯 Directives: ${directives.length}`);
    directives.forEach((dir) => {
      const selector = dir.selector ? ` [${dir.selector}]` : '';
      console.log(`   - ${dir.name}${selector} (${dir.filePath})`);
    });

    console.log(`\n💉 Injectables: ${injectables.length}`);
    injectables.forEach((inj) => {
      console.log(`   - ${inj.name} (${inj.filePath})`);
    });

    console.log(`\n🔧 Pipes: ${pipes.length}`);
    pipes.forEach((pipe) => {
      const name = pipe.name;
      const pure = pipe.pure !== false ? ' (pure)' : ' (impure)';
      console.log(`   - ${name}${pure} (${pipe.filePath})`);
    });

    // Generate comprehensive markdown
    const markdown = generateAdvancedMarkdown(modules, components, directives, injectables, pipes);
    require('fs').writeFileSync('architecture-advanced.md', markdown);

    console.log('\n📄 Advanced markdown report saved: architecture-advanced.md');

    // Analyze relationships
    console.log('\n🔗 Analyzing Relationships...');
    analyzeRelationships(modules, components, directives, injectables);
  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
    console.error('💡 Make sure the project is compiled with ngcc or Ivy');
  }
}

function generateAdvancedMarkdown(modules, components, directives, injectables, pipes) {
  let md = '# Advanced Angular Architecture Analysis (ngast)\n\n';
  md += 'Generated using ngast - Angular AST analysis tool\n\n';

  // Statistics
  md += '## 📊 Project Statistics\n\n';
  md += `| Entity Type | Count |\n`;
  md += `|-------------|-------|\n`;
  md += `| Modules | ${modules.length} |\n`;
  md += `| Components | ${components.length} |\n`;
  md += `| Directives | ${directives.length} |\n`;
  md += `| Injectables | ${injectables.length} |\n`;
  md += `| Pipes | ${pipes.length} |\n\n`;

  // Modules section
  if (modules.length > 0) {
    md += '## 🏗️ Modules\n\n';
    modules.forEach((mod) => {
      md += `### ${mod.name}\n`;
      md += `- **File**: \`${mod.filePath}\`\n`;
      if (mod.providers && mod.providers.length > 0) {
        md += `- **Providers**: ${mod.providers.length}\n`;
        mod.providers.forEach((provider) => {
          md += `  - ${provider.name || provider}\n`;
        });
      }
      if (mod.imports && mod.imports.length > 0) {
        md += `- **Imports**: ${mod.imports.length} modules\n`;
      }
      if (mod.declarations && mod.declarations.length > 0) {
        md += `- **Declarations**: ${mod.declarations.length} items\n`;
      }
      md += '\n';
    });
  }

  // Components section
  if (components.length > 0) {
    md += '## 🧩 Components\n\n';
    const groupedComponents = groupByDirectory(components);
    Object.keys(groupedComponents)
      .sort()
      .forEach((dir) => {
        md += `### ${dir}\n\n`;
        groupedComponents[dir].forEach((comp) => {
          md += `#### ${comp.name}\n`;
          md += `- **Selector**: \`${comp.selector || 'N/A'}\`\n`;
          md += `- **File**: \`${comp.filePath}\`\n`;
          if (comp.inputs && comp.inputs.length > 0) {
            md += `- **Inputs**: ${comp.inputs.map((i) => `\`${i.name}\``).join(', ')}\n`;
          }
          if (comp.outputs && comp.outputs.length > 0) {
            md += `- **Outputs**: ${comp.outputs.map((o) => `\`${o.name}\``).join(', ')}\n`;
          }
          md += '\n';
        });
      });
  }

  // Directives section
  if (directives.length > 0) {
    md += '## 🎯 Directives\n\n';
    directives.forEach((dir) => {
      md += `### ${dir.name}\n`;
      md += `- **Selector**: \`${dir.selector || 'N/A'}\`\n`;
      md += `- **File**: \`${dir.filePath}\`\n`;
      if (dir.inputs && dir.inputs.length > 0) {
        md += `- **Inputs**: ${dir.inputs.map((i) => `\`${i.name}\``).join(', ')}\n`;
      }
      if (dir.outputs && dir.outputs.length > 0) {
        md += `- **Outputs**: ${dir.outputs.map((o) => `\`${o.name}\``).join(', ')}\n`;
      }
      md += '\n';
    });
  }

  // Injectables section
  if (injectables.length > 0) {
    md += '## 💉 Injectables (Services)\n\n';
    injectables.forEach((inj) => {
      md += `### ${inj.name}\n`;
      md += `- **File**: \`${inj.filePath}\`\n`;
      md += '\n';
    });
  }

  // Pipes section
  if (pipes.length > 0) {
    md += '## 🔧 Pipes\n\n';
    pipes.forEach((pipe) => {
      md += `### ${pipe.name}\n`;
      md += `- **Pure**: ${pipe.pure !== false ? 'Yes' : 'No'}\n`;
      md += `- **File**: \`${pipe.filePath}\`\n`;
      md += '\n';
    });
  }

  return md;
}

function groupByDirectory(items) {
  const groups = {};
  items.forEach((item) => {
    const dir = require('path').dirname(item.filePath);
    if (!groups[dir]) groups[dir] = [];
    groups[dir].push(item);
  });
  return groups;
}

function analyzeRelationships(modules, components, directives, injectables) {
  console.log('🔗 Module-Component Relationships:');

  modules.forEach((mod) => {
    console.log(`\n📦 ${mod.name}:`);
    if (mod.declarations && mod.declarations.length > 0) {
      console.log(
        `   Components: ${mod.declarations.filter((d) => d.type === 'component').length}`
      );
      console.log(
        `   Directives: ${mod.declarations.filter((d) => d.type === 'directive').length}`
      );
    }
    if (mod.providers && mod.providers.length > 0) {
      console.log(`   Services: ${mod.providers.length}`);
    }
  });

  console.log('\n🏗️ Architecture Insights:');
  console.log(`   - Standalone Components: ${components.filter((c) => c.standalone).length}`);
  console.log(`   - Module-based Components: ${components.filter((c) => !c.standalone).length}`);
  console.log(`   - Injectable Services: ${injectables.filter((i) => i.injectable).length}`);
}

// Run analysis
analyzeWithNgast().catch(console.error);
