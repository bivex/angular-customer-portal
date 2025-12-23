/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T06:43:00
 * Last Updated: 2025-12-23T02:28:24
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

const ts = require('typescript');
const fs = require('fs');
const path = require('path');

class ComponentSymbol {
  constructor(name, filePath, node, metadata) {
    this.name = name;
    this.filePath = filePath;
    this.node = node;
    this.metadata = metadata;
    this.metrics = this.calculateMetrics();
    this.analysis = this.performAnalysis();
  }

  getProviders() {
    return this.metadata.providers || [];
  }

  calculateMetrics() {
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      const lines = content.split('\n');
      const codeLines = lines.filter(
        (line) =>
          line.trim().length > 0 && !line.trim().startsWith('//') && !line.trim().startsWith('/*')
      );

      return {
        fileSize: content.length,
        totalLines: lines.length,
        codeLines: codeLines.length,
        complexity: this.calculateComplexity(content),
        imports: this.countImports(content),
      };
    } catch (error) {
      return { fileSize: 0, totalLines: 0, codeLines: 0, complexity: 0, imports: 0 };
    }
  }

  calculateComplexity(content) {
    let complexity = 1; // базовая сложность
    const patterns = [
      /\bif\s*\(/g,
      /\belse\s*\{/g,
      /\bfor\s*\(/g,
      /\bwhile\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /\b&&/g,
      /\b\|\|/g,
      /\?/g, // тернарный оператор
    ];

    patterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) complexity += matches.length;
    });

    return complexity;
  }

  countImports(content) {
    const importMatches = content.match(/^import\s+.*from\s+['"'][^'"']+['"']/gm);
    return importMatches ? importMatches.length : 0;
  }

  performAnalysis() {
    const analysis = {
      patterns: [],
      issues: [],
      recommendations: [],
    };

    // Анализ размера
    if (this.metrics.codeLines > 300) {
      analysis.issues.push('Large component (>300 lines)');
      analysis.recommendations.push('Consider breaking down into smaller components');
    }

    // Анализ сложности
    if (this.metrics.complexity > 10) {
      analysis.issues.push(`High complexity (${this.metrics.complexity})`);
      analysis.recommendations.push('Consider extracting complex logic into services');
    }

    // Анализ провайдеров
    const providers = this.getProviders();
    if (providers.length > 3) {
      analysis.issues.push(`Too many providers (${providers.length})`);
      analysis.recommendations.push('Consider moving providers to module level');
    }

    // Анализ шаблона
    if (this.metadata.template && this.metadata.template.length > 1000) {
      analysis.issues.push('Large inline template');
      analysis.recommendations.push('Consider using external template file');
    }

    // Анализ производительности
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');

      // Проверка OnPush стратегии
      if (
        !content.includes('OnPush') &&
        !content.includes('changeDetection: ChangeDetectionStrategy.OnPush')
      ) {
        analysis.issues.push('Missing OnPush change detection strategy');
        analysis.recommendations.push('Consider using OnPush strategy for better performance');
      } else {
        analysis.patterns.push('OnPush change detection');
      }

      // Проверка на использование async pipe
      if (content.includes('| async') || content.includes('AsyncPipe')) {
        analysis.patterns.push('Async pipe usage');
      }

      // Проверка на manual change detection
      if (
        content.includes('ChangeDetectorRef') ||
        content.includes('detectChanges()') ||
        content.includes('markForCheck()')
      ) {
        analysis.patterns.push('Manual change detection');
      }

      // Проверка на ViewEncapsulation
      if (content.includes('ViewEncapsulation.None')) {
        analysis.issues.push('ViewEncapsulation.None reduces performance');
        analysis.recommendations.push('Consider using ShadowDom or Emulated encapsulation');
      }

      // Проверка на trackBy functions
      if (content.includes('*ngFor') && !content.includes('trackBy')) {
        analysis.issues.push('Missing trackBy function in ngFor');
        analysis.recommendations.push('Add trackBy function to improve ngFor performance');
      }

      // Анализ безопасности
      // Проверка на прямое использование innerHTML (XSS risk)
      if (content.includes('innerHTML') || content.includes('[innerHTML]')) {
        analysis.issues.push('Potential XSS vulnerability (innerHTML usage)');
        analysis.recommendations.push('Use DomSanitizer or avoid innerHTML when possible');
      }

      // Проверка на валидацию форм
      if (content.includes('FormGroup') || content.includes('FormControl')) {
        if (!content.includes('Validators.') && !content.includes('validator')) {
          analysis.issues.push('Form without validation');
          analysis.recommendations.push('Add proper form validation');
        } else {
          analysis.patterns.push('Form validation present');
        }
      }

      // Проверка на обработку ошибок
      if (
        content.includes('subscribe(') &&
        !content.includes('catchError') &&
        !content.includes('error')
      ) {
        analysis.issues.push('Missing error handling in subscriptions');
        analysis.recommendations.push('Add proper error handling with catchError');
      }
    } catch (error) {
      // ignore
    }

    return analysis;
  }
}

class DirectiveSymbol {
  constructor(name, filePath, node, metadata) {
    this.name = name;
    this.filePath = filePath;
    this.node = node;
    this.metadata = metadata;
    this.metrics = this.calculateMetrics();
    this.analysis = this.performAnalysis();
  }

  calculateMetrics() {
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      const lines = content.split('\n');
      const codeLines = lines.filter(
        (line) =>
          line.trim().length > 0 && !line.trim().startsWith('//') && !line.trim().startsWith('/*')
      );

      return {
        fileSize: content.length,
        totalLines: lines.length,
        codeLines: codeLines.length,
        complexity: this.calculateComplexity(content),
        imports: this.countImports(content),
      };
    } catch (error) {
      return { fileSize: 0, totalLines: 0, codeLines: 0, complexity: 0, imports: 0 };
    }
  }

  calculateComplexity(content) {
    let complexity = 1;
    const patterns = [
      /\bif\s*\(/g,
      /\belse\s*\{/g,
      /\bfor\s*\(/g,
      /\bwhile\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /\b&&/g,
      /\b\|\|/g,
      /\?/g,
    ];

    patterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) complexity += matches.length;
    });

    return complexity;
  }

  countImports(content) {
    const importMatches = content.match(/^import\s+.*from\s+['"'][^'"']+['"']/gm);
    return importMatches ? importMatches.length : 0;
  }

  performAnalysis() {
    const analysis = { patterns: [], issues: [], recommendations: [] };

    if (this.metrics.codeLines > 100) {
      analysis.issues.push('Large directive (>100 lines)');
      analysis.recommendations.push('Consider extracting logic into service');
    }

    if (this.metrics.complexity > 5) {
      analysis.issues.push(`High complexity (${this.metrics.complexity})`);
      analysis.recommendations.push('Simplify directive logic');
    }

    return analysis;
  }
}

class PipeSymbol {
  constructor(name, filePath, node, metadata) {
    this.name = name;
    this.filePath = filePath;
    this.node = node;
    this.metadata = metadata;
  }
}

class InjectableSymbol {
  constructor(name, filePath, node, metadata) {
    this.name = name;
    this.filePath = filePath;
    this.node = node;
    this.metadata = metadata;
    this.metrics = this.calculateMetrics();
    this.analysis = this.performAnalysis();
  }

  calculateMetrics() {
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      const lines = content.split('\n');
      const codeLines = lines.filter(
        (line) =>
          line.trim().length > 0 && !line.trim().startsWith('//') && !line.trim().startsWith('/*')
      );

      return {
        fileSize: content.length,
        totalLines: lines.length,
        codeLines: codeLines.length,
        complexity: this.calculateComplexity(content),
        imports: this.countImports(content),
        methods: this.countMethods(content),
        dependencies: this.countDependencies(content),
      };
    } catch (error) {
      return {
        fileSize: 0,
        totalLines: 0,
        codeLines: 0,
        complexity: 0,
        imports: 0,
        methods: 0,
        dependencies: 0,
      };
    }
  }

  calculateComplexity(content) {
    let complexity = 1;
    const patterns = [
      /\bif\s*\(/g,
      /\belse\s*\{/g,
      /\bfor\s*\(/g,
      /\bwhile\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /\b&&/g,
      /\b\|\|/g,
      /\?/g,
    ];

    patterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) complexity += matches.length;
    });

    return complexity;
  }

  countImports(content) {
    const importMatches = content.match(/^import\s+.*from\s+['"'][^'"']+['"']/gm);
    return importMatches ? importMatches.length : 0;
  }

  countMethods(content) {
    // Подсчет методов (публичных и приватных)
    const methodMatches = content.match(/(?:public|private|protected)?\s+\w+\s*\([^)]*\)\s*[:{]/g);
    return methodMatches ? methodMatches.length : 0;
  }

  countDependencies(content) {
    // Подсчет внедренных зависимостей в конструкторе
    const constructorMatch = content.match(/constructor\s*\([^)]*\)/);
    if (constructorMatch) {
      const params = constructorMatch[0].match(/private\s+\w+:\s*\w+/g);
      return params ? params.length : 0;
    }
    return 0;
  }

  performAnalysis() {
    const analysis = { patterns: [], issues: [], recommendations: [] };

    if (this.metrics.codeLines > 200) {
      analysis.issues.push('Large service (>200 lines)');
      analysis.recommendations.push('Consider splitting into multiple services');
    }

    if (this.metrics.complexity > 15) {
      analysis.issues.push(`High complexity (${this.metrics.complexity})`);
      analysis.recommendations.push('Extract complex logic into separate methods or services');
    }

    if (this.metrics.methods > 10) {
      analysis.issues.push(`Too many methods (${this.metrics.methods})`);
      analysis.recommendations.push('Consider Single Responsibility Principle violation');
    }

    if (this.metrics.dependencies > 5) {
      analysis.issues.push(`Too many dependencies (${this.metrics.dependencies})`);
      analysis.recommendations.push('Consider reducing coupling or using facade pattern');
    }

    // Анализ паттернов
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');

      if (content.includes('HttpClient')) {
        analysis.patterns.push('HTTP Client usage');
      }

      if (content.includes('BehaviorSubject') || content.includes('Subject')) {
        analysis.patterns.push('Reactive state management');
      }

      if (content.includes('localStorage') || content.includes('sessionStorage')) {
        analysis.patterns.push('Browser storage usage');
      }

      // Анализ безопасности для сервисов
      // Проверка на использование HttpClient
      if (content.includes('HttpClient')) {
        analysis.patterns.push('HTTP client usage');

        // Проверка на отсутствие interceptors
        if (!content.includes('HttpInterceptor') && !content.includes('intercept')) {
          analysis.issues.push('HTTP client without interceptors');
          analysis.recommendations.push('Consider adding authentication/error interceptors');
        }

        // Проверка на обработку HTTP ошибок
        if (
          content.includes('.subscribe(') &&
          !content.includes('catchError') &&
          !content.includes('handleError')
        ) {
          analysis.issues.push('HTTP requests without error handling');
          analysis.recommendations.push('Add proper HTTP error handling');
        }

        // Проверка на использование HTTPS
        if (content.includes('http://')) {
          analysis.issues.push('HTTP URLs detected (should use HTTPS)');
          analysis.recommendations.push('Use HTTPS URLs for security');
        }
      }

      // Проверка на использование localStorage/sessionStorage
      if (content.includes('localStorage') || content.includes('sessionStorage')) {
        analysis.patterns.push('Browser storage usage');
        analysis.issues.push('Sensitive data in browser storage');
        analysis.recommendations.push('Consider using secure storage or encryption');
      }

      // Проверка на работу с токенами
      if (content.includes('token') || content.includes('jwt') || content.includes('JWT')) {
        analysis.patterns.push('Token handling');
        if (!content.includes('HttpOnly') && !content.includes('secure')) {
          analysis.issues.push('Token storage not secured');
          analysis.recommendations.push('Use HttpOnly cookies for tokens');
        }
      }

      // Анализ тестируемости
      // Проверка на constructor injection
      const constructorMatch = content.match(/constructor\s*\([^)]*\)/);
      if (constructorMatch) {
        const constructorContent = constructorMatch[0];
        if (constructorContent.includes('private') || constructorContent.includes('public')) {
          analysis.patterns.push('Constructor injection');
        } else {
          analysis.issues.push('No dependency injection in constructor');
          analysis.recommendations.push('Use constructor injection for better testability');
        }

        // Проверка на слишком много зависимостей
        const params = constructorContent.match(/private\s+\w+:\s*\w+/g) || [];
        if (params.length > 4) {
          analysis.issues.push(`Too many constructor dependencies (${params.length})`);
          analysis.recommendations.push('Consider reducing dependencies or using facade pattern');
        }
      }

      // Проверка на асинхронные операции без обработки
      if (content.includes('Promise') || content.includes('Observable')) {
        if (
          !content.includes('async') &&
          !content.includes('await') &&
          !content.includes('subscribe')
        ) {
          analysis.issues.push('Async operations without proper handling');
          analysis.recommendations.push('Handle async operations properly for testability');
        }
      }

      // Проверка на использование console.log (антипаттерн в продакшене)
      if (content.includes('console.log') || content.includes('console.error')) {
        analysis.issues.push('Console logging in production code');
        analysis.recommendations.push('Use proper logging service instead of console');
      }
    } catch (error) {
      // ignore
    }

    return analysis;
  }
}

class ModuleSymbol {
  constructor(name, filePath, node, metadata) {
    this.name = name;
    this.filePath = filePath;
    this.node = node;
    this.metadata = metadata;
    this.metrics = this.calculateMetrics();
    this.analysis = this.performAnalysis();
  }

  calculateMetrics() {
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      const lines = content.split('\n');
      const codeLines = lines.filter(
        (line) =>
          line.trim().length > 0 && !line.trim().startsWith('//') && !line.trim().startsWith('/*')
      );

      return {
        fileSize: content.length,
        totalLines: lines.length,
        codeLines: codeLines.length,
        complexity: this.calculateComplexity(content),
        imports: this.countImports(content),
        declarations: this.metadata.declarations?.length || 0,
        moduleImports: this.metadata.imports?.length || 0,
        exports: this.metadata.exports?.length || 0,
        providers: this.metadata.providers?.length || 0,
      };
    } catch (error) {
      return {
        fileSize: 0,
        totalLines: 0,
        codeLines: 0,
        complexity: 0,
        imports: 0,
        declarations: 0,
        moduleImports: 0,
        exports: 0,
        providers: 0,
      };
    }
  }

  calculateComplexity(content) {
    let complexity = 1;
    const patterns = [
      /\bif\s*\(/g,
      /\belse\s*\{/g,
      /\bfor\s*\(/g,
      /\bwhile\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /\b&&/g,
      /\b\|\|/g,
      /\?/g,
    ];

    patterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) complexity += matches.length;
    });

    return complexity;
  }

  countImports(content) {
    const importMatches = content.match(/^import\s+.*from\s+['"'][^'"']+['"']/gm);
    return importMatches ? importMatches.length : 0;
  }

  performAnalysis() {
    const analysis = { patterns: [], issues: [], recommendations: [] };

    if (this.metrics.declarations > 20) {
      analysis.issues.push(`Too many declarations (${this.metrics.declarations})`);
      analysis.recommendations.push('Consider splitting module into feature modules');
    }

    if (this.metrics.moduleImports > 15) {
      analysis.issues.push(`Too many imports (${this.metrics.moduleImports})`);
      analysis.recommendations.push('Consider using shared modules or barrels');
    }

    if (this.metrics.providers > 10) {
      analysis.issues.push(`Too many providers (${this.metrics.providers})`);
      analysis.recommendations.push('Consider using core module for shared providers');
    }

    if (this.metrics.exports > 20) {
      analysis.issues.push(`Too many exports (${this.metrics.exports})`);
      analysis.recommendations.push('Consider selective exports or public API');
    }

    // Проверка на наличие bootstrap
    if (this.metadata.bootstrap && this.metadata.bootstrap.length > 0) {
      analysis.patterns.push('Root module (has bootstrap)');
    }

    // Проверка на routing module
    if (this.name.includes('Routing')) {
      analysis.patterns.push('Routing module');
    }

    return analysis;
  }
}

class WorkspaceSymbols {
  constructor(configPath) {
    const config = ts.readConfigFile(configPath, ts.sys.readFile);
    if (config.error) {
      throw new Error(`Failed to read config: ${config.error.messageText}`);
    }

    const parsedConfig = ts.parseJsonConfigFileContent(
      config.config,
      ts.sys,
      path.dirname(configPath)
    );

    if (parsedConfig.errors.length > 0) {
      throw new Error(
        `Config parse errors: ${parsedConfig.errors.map((e) => e.messageText).join(', ')}`
      );
    }

    this.program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
    this.checker = this.program.getTypeChecker();
    this.symbols = [];

    this.analyzeWorkspace();
  }

  analyzeWorkspace() {
    const sourceFiles = this.program.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      if (sourceFile.fileName.includes('node_modules') || sourceFile.fileName.endsWith('.d.ts')) {
        continue;
      }

      this.analyzeSourceFile(sourceFile);
    }
  }

  analyzeSourceFile(sourceFile) {
    const visit = (node) => {
      if (ts.isClassDeclaration(node) && node.name) {
        const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
        if (decorators) {
          const symbol = this.analyzeClass(node, decorators, sourceFile.fileName);
          if (symbol) {
            this.symbols.push(symbol);
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  analyzeClass(node, decorators, filePath) {
    const className = node.name.getText();

    for (const decorator of decorators) {
      const decoratorName = this.getDecoratorName(decorator);
      const metadata = this.extractDecoratorMetadata(decorator);

      switch (decoratorName) {
        case 'Component':
          return new ComponentSymbol(className, filePath, node, metadata);
        case 'Directive':
          return new DirectiveSymbol(className, filePath, node, metadata);
        case 'Pipe':
          return new PipeSymbol(className, filePath, node, metadata);
        case 'Injectable':
          return new InjectableSymbol(className, filePath, node, metadata);
        case 'NgModule':
          return new ModuleSymbol(className, filePath, node, metadata);
      }
    }

    return null;
  }

  getDecoratorName(decorator) {
    if (ts.isCallExpression(decorator.expression)) {
      const expression = decorator.expression.expression;
      if (ts.isIdentifier(expression)) {
        return expression.getText();
      }
    }
    return '';
  }

  extractDecoratorMetadata(decorator) {
    if (ts.isCallExpression(decorator.expression) && decorator.expression.arguments.length > 0) {
      const arg = decorator.expression.arguments[0];
      if (ts.isObjectLiteralExpression(arg)) {
        return this.extractObjectLiteral(arg);
      }
    }
    return {};
  }

  extractObjectLiteral(obj) {
    const result = {};

    for (const prop of obj.properties) {
      if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
        const key = prop.name.getText();
        const value = this.extractPropertyValue(prop.initializer);
        result[key] = value;
      }
    }

    return result;
  }

  extractPropertyValue(node) {
    if (ts.isStringLiteral(node)) {
      return node.text;
    }
    if (ts.isArrayLiteralExpression(node)) {
      return node.elements.map((el) => this.extractPropertyValue(el));
    }
    if (ts.isObjectLiteralExpression(node)) {
      return this.extractObjectLiteral(node);
    }
    if (ts.isIdentifier(node)) {
      return node.getText();
    }
    // For more complex expressions, return the text
    return node.getText();
  }

  getAllComponents() {
    return this.symbols.filter((s) => s instanceof ComponentSymbol);
  }

  getAllDirectives() {
    return this.symbols.filter((s) => s instanceof DirectiveSymbol);
  }

  getAllPipes() {
    return this.symbols.filter((s) => s instanceof PipeSymbol);
  }

  getAllInjectable() {
    return this.symbols.filter((s) => s instanceof InjectableSymbol);
  }

  getAllModules() {
    return this.symbols.filter((s) => s instanceof ModuleSymbol);
  }

  // Анализ связанности между компонентами
  buildDependencyGraph() {
    const graph = {
      components: [],
      services: [],
      modules: [],
      edges: [],
    };

    // Собираем все символы по типам
    const components = this.getAllComponents();
    const injectables = this.getAllInjectable();
    const modules = this.getAllModules();

    // Анализируем зависимости компонентов от сервисов
    components.forEach((comp) => {
      graph.components.push({
        name: comp.name,
        file: comp.filePath,
        providers: comp.getProviders(),
      });

      // Связи компонент с провайдерами
      comp.getProviders().forEach((provider) => {
        const serviceName = typeof provider === 'string' ? provider : provider.provide || provider;
        graph.edges.push({
          from: comp.name,
          to: serviceName,
          type: 'provides',
        });
      });
    });

    // Анализируем модули
    modules.forEach((mod) => {
      graph.modules.push({
        name: mod.name,
        file: mod.filePath,
        declarations: mod.metadata.declarations || [],
        imports: mod.metadata.imports || [],
        exports: mod.metadata.exports || [],
      });

      // Связи модулей с декларациями
      (mod.metadata.declarations || []).forEach((decl) => {
        const declName = typeof decl === 'string' ? decl : decl.name || decl;
        graph.edges.push({
          from: mod.name,
          to: declName,
          type: 'declares',
        });
      });

      // Связи модулей с импортами
      (mod.metadata.imports || []).forEach((imp) => {
        const impName = typeof imp === 'string' ? imp : imp.name || imp;
        graph.edges.push({
          from: mod.name,
          to: impName,
          type: 'imports',
        });
      });
    });

    // Анализируем сервисы
    injectables.forEach((inj) => {
      graph.services.push({
        name: inj.name,
        file: inj.filePath,
        providedIn: inj.metadata.providedIn,
      });
    });

    return graph;
  }

  getComponentDependencies(componentName) {
    const graph = this.buildDependencyGraph();
    return graph.edges.filter((edge) => edge.from === componentName);
  }

  getComponentDependents(componentName) {
    const graph = this.buildDependencyGraph();
    return graph.edges.filter((edge) => edge.to === componentName);
  }

  // Анализ зависимостей проекта
  analyzeDependencies() {
    const analysis = {
      internalDeps: new Map(),
      externalDeps: new Map(),
      circularDeps: [],
      problematicDeps: [],
    };

    // Анализируем все исходные файлы
    for (const sourceFile of this.program.getSourceFiles()) {
      if (sourceFile.fileName.includes('node_modules') || sourceFile.fileName.endsWith('.d.ts')) {
        continue;
      }

      this.analyzeFileDependencies(sourceFile, analysis);
    }

    return analysis;
  }

  analyzeFileDependencies(sourceFile, analysis) {
    const content = sourceFile.getFullText();
    const importStatements = content.match(/^import\s+.*from\s+['"'][^'"']+['"']/gm) || [];

    importStatements.forEach((importStmt) => {
      const match = importStmt.match(/from\s+['"]([^'"]+)['"]/);
      if (match) {
        const importPath = match[1];

        if (
          importPath.startsWith('@angular') ||
          importPath.startsWith('rxjs') ||
          (!importPath.startsWith('./') &&
            !importPath.startsWith('../') &&
            !importPath.startsWith('@/'))
        ) {
          // Внешняя зависимость
          const count = analysis.externalDeps.get(importPath) || 0;
          analysis.externalDeps.set(importPath, count + 1);
        } else {
          // Внутренняя зависимость
          const count = analysis.internalDeps.get(importPath) || 0;
          analysis.internalDeps.set(importPath, count + 1);
        }

        // Проверка на проблемные импорты
        if (importPath.includes('shared') && importPath.includes('feature')) {
          analysis.problematicDeps.push({
            file: sourceFile.fileName,
            import: importPath,
            issue: 'Cross-cutting concern violation',
          });
        }

        if (importPath.includes('../') && importPath.split('../').length > 2) {
          analysis.problematicDeps.push({
            file: sourceFile.fileName,
            import: importPath,
            issue: 'Deep relative import',
          });
        }
      }
    });
  }
}

function analyze() {
  try {
    console.log('🚀 Starting analysis with new TypeScript-based implementation...\n');

    // Создаем папку для сохранения анализа
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const analysisDir = `./architecture-analysis-${timestamp}`;

    if (!fs.existsSync(analysisDir)) {
      fs.mkdirSync(analysisDir, { recursive: true });
    }

    console.log(`📁 Analysis will be saved to: ${analysisDir}\n`);

    // Подключаемся к tsconfig.app.json для анализа Angular приложений
    const workspace = new WorkspaceSymbols('./tsconfig.app.json');

    // Строим граф зависимостей
    const dependencyGraph = workspace.buildDependencyGraph();

    // Анализируем зависимости проекта
    const dependencyAnalysis = workspace.analyzeDependencies();

    // Генерируем рекомендации по архитектуре
    const recommendations = generateArchitectureRecommendations(
      workspace,
      dependencyGraph,
      dependencyAnalysis
    );

    console.log('# 📊 Angular Architecture Analysis\n');

    console.log('## 📈 Summary\n');
    console.log(`- **Components**: ${dependencyGraph.components.length}`);
    console.log(`- **Services**: ${dependencyGraph.services.length}`);
    console.log(`- **Modules**: ${dependencyGraph.modules.length}`);
    console.log(`- **Dependencies**: ${dependencyGraph.edges.length}\n`);

    // Components с анализом связанности
    console.log('## 🔍 Components\n');
    const components = workspace.getAllComponents();

    components.forEach((comp, index) => {
      console.log(`### ${index + 1}. ${comp.name}\n`);

      console.log(`**File**: \`${comp.filePath}\``);
      console.log(`**Selector**: \`${comp.metadata.selector || 'none'}\``);

      if (comp.metadata.template) {
        console.log(
          `**Template**: \`${comp.metadata.template.substring(0, 50)}${comp.metadata.template.length > 50 ? '...' : ''}\``
        );
      }

      console.log(
        `**Styles**: ${comp.metadata.styles?.length || 0} inline, ${comp.metadata.styleUrls?.length || 0} files`
      );
      console.log(`**Providers**: ${comp.getProviders().length}\n`);

      // Метрики компонента
      console.log(`**📊 Metrics**:`);
      console.log(`  - Lines of code: ${comp.metrics.codeLines}`);
      console.log(`  - Complexity: ${comp.metrics.complexity}`);
      console.log(`  - File size: ${comp.metrics.fileSize} bytes`);
      console.log(`  - Imports: ${comp.metrics.imports}\n`);

      // Анализ и рекомендации
      if (comp.analysis.issues.length > 0) {
        console.log('**⚠️ Issues**:');
        comp.analysis.issues.forEach((issue) => console.log(`  - ${issue}`));
        console.log('');
      }

      if (comp.analysis.recommendations.length > 0) {
        console.log('**💡 Recommendations**:');
        comp.analysis.recommendations.forEach((rec) => console.log(`  - ${rec}`));
        console.log('');
      }

      // Анализ зависимостей компонента
      const deps = workspace.getComponentDependencies(comp.name);
      const dependents = workspace.getComponentDependents(comp.name);

      if (deps.length > 0) {
        console.log('**Dependencies** (что использует этот компонент):');
        deps.forEach((dep) => {
          console.log(`- ${dep.type}: \`${dep.to}\``);
        });
        console.log('');
      }

      if (dependents.length > 0) {
        console.log('**Used by** (кто использует этот компонент):');
        dependents.forEach((dep) => {
          console.log(`- ${dep.type}: \`${dep.from}\``);
        });
        console.log('');
      }
    });

    // Services с анализом связанности
    console.log('## 💉 Services\n');
    const injectables = workspace.getAllInjectable();

    injectables.forEach((inj, index) => {
      console.log(`### ${index + 1}. ${inj.name}\n`);

      console.log(`**File**: \`${inj.filePath}\``);
      console.log(`**Provided in**: \`${inj.metadata.providedIn || 'unknown'}\`\n`);

      // Метрики сервиса
      console.log(`**📊 Metrics**:`);
      console.log(`  - Lines of code: ${inj.metrics.codeLines}`);
      console.log(`  - Complexity: ${inj.metrics.complexity}`);
      console.log(`  - Methods: ${inj.metrics.methods}`);
      console.log(`  - Dependencies: ${inj.metrics.dependencies}`);
      console.log(`  - File size: ${inj.metrics.fileSize} bytes\n`);

      // Паттерны
      if (inj.analysis.patterns.length > 0) {
        console.log('**🔧 Patterns**:');
        inj.analysis.patterns.forEach((pattern) => console.log(`  - ${pattern}`));
        console.log('');
      }

      // Кто предоставляет этот сервис
      const providers = dependencyGraph.edges.filter(
        (edge) => edge.to === inj.name && edge.type === 'provides'
      );
      if (providers.length > 0) {
        console.log('**Provided by**:');
        providers.forEach((p) => {
          console.log(`- \`${p.from}\``);
        });
        console.log('');
      }

      // Анализ и рекомендации
      if (inj.analysis.issues.length > 0) {
        console.log('**⚠️ Issues**:');
        inj.analysis.issues.forEach((issue) => console.log(`  - ${issue}`));
        console.log('');
      }

      if (inj.analysis.recommendations.length > 0) {
        console.log('**💡 Recommendations**:');
        inj.analysis.recommendations.forEach((rec) => console.log(`  - ${rec}`));
        console.log('');
      }
    });

    // Modules с анализом связанности
    console.log('## 📦 Modules\n');
    const modules = workspace.getAllModules();

    modules.forEach((mod, index) => {
      console.log(`### ${index + 1}. ${mod.name}\n`);

      console.log(`**File**: \`${mod.filePath}\``);
      console.log(`**Declarations**: ${mod.metadata.declarations?.length || 0}`);
      console.log(`**Imports**: ${mod.metadata.imports?.length || 0}`);
      console.log(`**Exports**: ${mod.metadata.exports?.length || 0}`);
      console.log(`**Bootstrap**: ${mod.metadata.bootstrap?.length || 0}\n`);

      // Метрики модуля
      console.log(`**📊 Metrics**:`);
      console.log(`  - Lines of code: ${mod.metrics.codeLines}`);
      console.log(`  - Complexity: ${mod.metrics.complexity}`);
      console.log(`  - File size: ${mod.metrics.fileSize} bytes`);
      console.log(`  - Providers: ${mod.metrics.providers}\n`);

      // Паттерны
      if (mod.analysis.patterns.length > 0) {
        console.log('**🔧 Patterns**:');
        mod.analysis.patterns.forEach((pattern) => console.log(`  - ${pattern}`));
        console.log('');
      }

      // Анализ зависимостей модуля
      const deps = workspace.getComponentDependencies(mod.name);
      const dependents = workspace.getComponentDependents(mod.name);

      if (deps.length > 0) {
        console.log('**Dependencies**:');
        deps.forEach((dep) => {
          console.log(`- ${dep.type}: \`${dep.to}\``);
        });
        console.log('');
      }

      if (dependents.length > 0) {
        console.log('**Imported by**:');
        dependents.forEach((dep) => {
          console.log(`- ${dep.type}: \`${dep.from}\``);
        });
        console.log('');
      }
    });

    // Директивы и пайпы
    const directives = workspace.getAllDirectives();
    if (directives.length > 0) {
      console.log('## 🎯 Directives\n');
      directives.forEach((dir, index) => {
        console.log(`### ${index + 1}. ${dir.name}\n`);
        console.log(`**File**: \`${dir.filePath}\``);
        console.log(`**Selector**: \`${dir.metadata.selector || 'none'}\`\n`);
      });
    }

    const pipes = workspace.getAllPipes();
    if (pipes.length > 0) {
      console.log('## 🔧 Pipes\n');
      pipes.forEach((pipe, index) => {
        console.log(`### ${index + 1}. ${pipe.name}\n`);
        console.log(`**File**: \`${pipe.filePath}\``);
        console.log(`**Pipe name**: \`${pipe.metadata.name || 'none'}\``);
        console.log(`**Pure**: ${pipe.metadata.pure !== false}\n`);
      });
    }

    // Анализ связанности
    console.log('## 🔗 Coupling Analysis\n');

    // Находим компоненты с высокой связанностью
    const couplingAnalysis = analyzeCoupling(dependencyGraph);

    if (couplingAnalysis.highCoupling.length > 0) {
      console.log('### ⚠️ High Coupling Components\n');
      couplingAnalysis.highCoupling.forEach((item) => {
        console.log(`- **${item.name}**: ${item.dependencies} dependencies`);
      });
      console.log('');
    }

    if (couplingAnalysis.isolated.length > 0) {
      console.log('### 🎯 Isolated Components\n');
      couplingAnalysis.isolated.forEach((item) => {
        console.log(`- **${item.name}**: no dependencies`);
      });
      console.log('');
    }

    // Анализ зависимостей
    console.log('## 📦 Dependencies Analysis\n');

    if (dependencyAnalysis.externalDeps.size > 0) {
      console.log('### External Dependencies (Top 10)\n');
      const sortedExt = Array.from(dependencyAnalysis.externalDeps.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      sortedExt.forEach(([dep, count]) => {
        console.log(`- \`${dep}\`: ${count} imports`);
      });
      console.log('');
    }

    if (dependencyAnalysis.internalDeps.size > 0) {
      console.log('### Internal Dependencies (Top 10)\n');
      const sortedInt = Array.from(dependencyAnalysis.internalDeps.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      sortedInt.forEach(([dep, count]) => {
        console.log(`- \`${dep}\`: ${count} imports`);
      });
      console.log('');
    }

    if (dependencyAnalysis.problematicDeps.length > 0) {
      console.log('### ⚠️ Problematic Dependencies\n');
      dependencyAnalysis.problematicDeps.forEach((dep) => {
        console.log(`- **${dep.file}** → \`${dep.import}\``);
        console.log(`  *${dep.issue}*`);
      });
      console.log('');
    }

    // Архитектурные рекомендации
    console.log('## 🎯 Architecture Recommendations\n');

    if (recommendations.critical.length > 0) {
      console.log('### 🚨 Critical Issues (Fix Immediately)\n');
      recommendations.critical.forEach((rec) => console.log(`- ${rec}`));
      console.log('');
    }

    if (recommendations.high.length > 0) {
      console.log('### ⚠️ High Priority\n');
      recommendations.high.forEach((rec) => console.log(`- ${rec}`));
      console.log('');
    }

    if (recommendations.medium.length > 0) {
      console.log('### 📋 Medium Priority\n');
      recommendations.medium.forEach((rec) => console.log(`- ${rec}`));
      console.log('');
    }

    if (recommendations.low.length > 0) {
      console.log('### 💡 Low Priority\n');
      recommendations.low.forEach((rec) => console.log(`- ${rec}`));
      console.log('');
    }

    // Сохраняем результаты анализа
    saveAnalysisResults(
      analysisDir,
      workspace,
      dependencyGraph,
      dependencyAnalysis,
      recommendations
    );

    console.log('## ✅ Analysis completed successfully!');
    console.log(`\n💾 Results saved to: ${analysisDir}/`);
    console.log('📄 Files generated:');
    console.log('  - analysis-summary.md (main report)');
    console.log('  - components-details.md');
    console.log('  - services-details.md');
    console.log('  - dependencies-report.md');
    console.log('  - recommendations.md\n');
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

function generateSummaryReport(workspace, dependencyGraph, dependencyAnalysis, recommendations) {
  const timestamp = new Date().toISOString();
  let content = `# 📊 Angular Architecture Analysis Report\n\n`;
  content += `**Generated on:** ${timestamp}\n\n`;

  // Summary
  content += `## 📈 Executive Summary\n\n`;
  content += `- **Components:** ${dependencyGraph.components.length}\n`;
  content += `- **Services:** ${dependencyGraph.services.length}\n`;
  content += `- **Modules:** ${dependencyGraph.modules.length}\n`;
  content += `- **Dependencies:** ${dependencyGraph.edges.length}\n\n`;

  // Critical Issues
  if (recommendations.critical.length > 0) {
    content += `## 🚨 Critical Issues (${recommendations.critical.length})\n\n`;
    recommendations.critical.forEach((rec) => (content += `- ${rec}\n`));
    content += '\n';
  }

  // High Priority Issues
  if (recommendations.high.length > 0) {
    content += `## ⚠️ High Priority Issues (${recommendations.high.length})\n\n`;
    recommendations.high.slice(0, 10).forEach((rec) => (content += `- ${rec}\n`));
    if (recommendations.high.length > 10)
      content += `- ... and ${recommendations.high.length - 10} more\n`;
    content += '\n';
  }

  // Architecture Health Score
  const healthScore = calculateHealthScore(
    workspace,
    dependencyGraph,
    dependencyAnalysis,
    recommendations
  );
  content += `## 🎯 Architecture Health Score\n\n`;
  content += `**Overall Score:** ${healthScore.score}/100\n\n`;
  content += `### Breakdown:\n`;
  Object.entries(healthScore.breakdown).forEach(([key, value]) => {
    content += `- **${key}:** ${value}/100\n`;
  });
  content += '\n';

  // Quick Stats
  content += `## 📊 Quick Stats\n\n`;
  const components = workspace.getAllComponents();
  const services = workspace.getAllInjectable();

  const avgComplexity =
    components.reduce((sum, c) => sum + c.metrics.complexity, 0) / components.length;
  const largeComponents = components.filter((c) => c.metrics.codeLines > 200).length;
  const highComplexityServices = services.filter((s) => s.metrics.complexity > 15).length;

  content += `- **Average Component Complexity:** ${avgComplexity.toFixed(1)}\n`;
  content += `- **Large Components (>200 lines):** ${largeComponents}\n`;
  content += `- **High Complexity Services:** ${highComplexityServices}\n`;
  content += `- **Problematic Dependencies:** ${dependencyAnalysis.problematicDeps.length}\n\n`;

  content += `## 📁 Detailed Reports\n\n`;
  content += `- [Components Details](./components-details.md)\n`;
  content += `- [Services Details](./services-details.md)\n`;
  content += `- [Dependencies Report](./dependencies-report.md)\n`;
  content += `- [Recommendations](./recommendations.md)\n\n`;

  content += `---\n*Generated by arho.js - Angular Architecture Analysis Tool*\n`;

  return content;
}

function calculateHealthScore(workspace, dependencyGraph, dependencyAnalysis, recommendations) {
  let score = 100;

  // Component health (30%)
  const components = workspace.getAllComponents();
  const componentScore =
    components.length === 0
      ? 100
      : 100 -
        (components.filter((c) => c.metrics.complexity > 10 || c.metrics.codeLines > 200).length /
          components.length) *
          50;
  score -= (100 - componentScore) * 0.3;

  // Service health (25%)
  const services = workspace.getAllInjectable();
  const serviceScore =
    services.length === 0
      ? 100
      : 100 -
        (services.filter((s) => s.metrics.complexity > 15 || s.metrics.methods > 15).length /
          services.length) *
          60;
  score -= (100 - serviceScore) * 0.25;

  // Dependency health (20%)
  const dependencyScore = Math.max(0, 100 - dependencyAnalysis.problematicDeps.length * 10);
  score -= (100 - dependencyScore) * 0.2;

  // Security health (15%)
  const securityIssues = recommendations.high.filter(
    (r) => r.includes('security') || r.includes('XSS') || r.includes('token')
  ).length;
  const securityScore = Math.max(0, 100 - securityIssues * 20);
  score -= (100 - securityScore) * 0.15;

  // Performance health (10%)
  const perfIssues = components.filter(
    (c) => !c.analysis.patterns.includes('OnPush change detection')
  ).length;
  const perfScore =
    components.length === 0 ? 100 : Math.max(0, 100 - (perfIssues / components.length) * 30);
  score -= (100 - perfScore) * 0.1;

  return {
    score: Math.round(Math.max(0, score)),
    breakdown: {
      Components: Math.round(componentScore),
      Services: Math.round(serviceScore),
      Dependencies: Math.round(dependencyScore),
      Security: Math.round(securityScore),
      Performance: Math.round(perfScore),
    },
  };
}

function generateComponentsReport(workspace) {
  let content = `# 🔍 Components Detailed Analysis\n\n`;
  content += `**Total Components:** ${workspace.getAllComponents().length}\n\n`;

  const components = workspace.getAllComponents();
  components.forEach((comp, index) => {
    content += `## ${index + 1}. ${comp.name}\n\n`;
    content += `**File:** \`${comp.filePath}\`\n`;
    content += `**Selector:** \`${comp.metadata.selector || 'none'}\`\n\n`;

    // Metrics
    content += `### 📊 Metrics\n\n`;
    content += `- **Lines of code:** ${comp.metrics.codeLines}\n`;
    content += `- **Complexity:** ${comp.metrics.complexity}\n`;
    content += `- **File size:** ${comp.metrics.fileSize} bytes\n`;
    content += `- **Imports:** ${comp.metrics.imports}\n\n`;

    // Patterns
    if (comp.analysis.patterns.length > 0) {
      content += `### 🔧 Patterns\n\n`;
      comp.analysis.patterns.forEach((pattern) => (content += `- ${pattern}\n`));
      content += '\n';
    }

    // Issues
    if (comp.analysis.issues.length > 0) {
      content += `### ⚠️ Issues\n\n`;
      comp.analysis.issues.forEach((issue) => (content += `- ${issue}\n`));
      content += '\n';
    }

    // Recommendations
    if (comp.analysis.recommendations.length > 0) {
      content += `### 💡 Recommendations\n\n`;
      comp.analysis.recommendations.forEach((rec) => (content += `- ${rec}\n`));
      content += '\n';
    }

    // Dependencies
    const deps = workspace.getComponentDependencies(comp.name);
    const dependents = workspace.getComponentDependents(comp.name);

    if (deps.length > 0) {
      content += `### 📤 Dependencies (uses)\n\n`;
      deps.forEach((dep) => (content += `- **${dep.type}:** \`${dep.to}\`\n`));
      content += '\n';
    }

    if (dependents.length > 0) {
      content += `### 📥 Used by\n\n`;
      dependents.forEach((dep) => (content += `- **${dep.type}:** \`${dep.from}\`\n`));
      content += '\n';
    }

    content += '---\n\n';
  });

  return content;
}

function generateServicesReport(workspace) {
  let content = `# 💉 Services Detailed Analysis\n\n`;
  content += `**Total Services:** ${workspace.getAllInjectable().length}\n\n`;

  const services = workspace.getAllInjectable();
  services.forEach((service, index) => {
    content += `## ${index + 1}. ${service.name}\n\n`;
    content += `**File:** \`${service.filePath}\`\n`;
    content += `**Provided in:** \`${service.metadata.providedIn || 'unknown'}\`\n\n`;

    // Metrics
    content += `### 📊 Metrics\n\n`;
    content += `- **Lines of code:** ${service.metrics.codeLines}\n`;
    content += `- **Complexity:** ${service.metrics.complexity}\n`;
    content += `- **Methods:** ${service.metrics.methods}\n`;
    content += `- **Dependencies:** ${service.metrics.dependencies}\n`;
    content += `- **File size:** ${service.metrics.fileSize} bytes\n\n`;

    // Patterns
    if (service.analysis.patterns.length > 0) {
      content += `### 🔧 Patterns\n\n`;
      service.analysis.patterns.forEach((pattern) => (content += `- ${pattern}\n`));
      content += '\n';
    }

    // Issues
    if (service.analysis.issues.length > 0) {
      content += `### ⚠️ Issues\n\n`;
      service.analysis.issues.forEach((issue) => (content += `- ${issue}\n`));
      content += '\n';
    }

    // Recommendations
    if (service.analysis.recommendations.length > 0) {
      content += `### 💡 Recommendations\n\n`;
      service.analysis.recommendations.forEach((rec) => (content += `- ${rec}\n`));
      content += '\n';
    }

    content += '---\n\n';
  });

  return content;
}

function generateDependenciesReport(dependencyAnalysis, dependencyGraph) {
  let content = `# 📦 Dependencies Analysis\n\n`;

  // External Dependencies
  if (dependencyAnalysis.externalDeps.size > 0) {
    content += `## 🌐 External Dependencies\n\n`;
    const sortedExt = Array.from(dependencyAnalysis.externalDeps.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    sortedExt.forEach(([dep, count]) => {
      content += `- \`${dep}\`: **${count}** imports\n`;
    });
    content += '\n';
  }

  // Internal Dependencies
  if (dependencyAnalysis.internalDeps.size > 0) {
    content += `## 🔗 Internal Dependencies\n\n`;
    const sortedInt = Array.from(dependencyAnalysis.internalDeps.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    sortedInt.forEach(([dep, count]) => {
      content += `- \`${dep}\`: **${count}** imports\n`;
    });
    content += '\n';
  }

  // Problematic Dependencies
  if (dependencyAnalysis.problematicDeps.length > 0) {
    content += `## ⚠️ Problematic Dependencies\n\n`;
    dependencyAnalysis.problematicDeps.forEach((dep) => {
      content += `### ${dep.file}\n\n`;
      content += `- **Import:** \`${dep.import}\`\n`;
      content += `- **Issue:** ${dep.issue}\n\n`;
    });
  }

  // Coupling Analysis
  const couplingAnalysis = analyzeCoupling(dependencyGraph);
  content += `## 🔗 Coupling Analysis\n\n`;

  if (couplingAnalysis.highCoupling.length > 0) {
    content += `### High Coupling Components\n\n`;
    couplingAnalysis.highCoupling.forEach((item) => {
      content += `- **${item.name}**: ${item.dependencies} dependencies\n`;
    });
    content += '\n';
  }

  if (couplingAnalysis.isolated.length > 0) {
    content += `### Isolated Components\n\n`;
    couplingAnalysis.isolated.forEach((item) => {
      content += `- **${item.name}**: no dependencies\n`;
    });
    content += '\n';
  }

  return content;
}

function generateRecommendationsReport(recommendations) {
  let content = `# 🎯 Architecture Recommendations\n\n`;

  if (recommendations.critical.length > 0) {
    content += `## 🚨 Critical Issues (Fix Immediately)\n\n`;
    recommendations.critical.forEach((rec) => (content += `- ${rec}\n`));
    content += '\n';
  }

  if (recommendations.high.length > 0) {
    content += `## ⚠️ High Priority\n\n`;
    recommendations.high.forEach((rec) => (content += `- ${rec}\n`));
    content += '\n';
  }

  if (recommendations.medium.length > 0) {
    content += `## 📋 Medium Priority\n\n`;
    recommendations.medium.forEach((rec) => (content += `- ${rec}\n`));
    content += '\n';
  }

  if (recommendations.low.length > 0) {
    content += `## 💡 Low Priority\n\n`;
    recommendations.low.forEach((rec) => (content += `- ${rec}\n`));
    content += '\n';
  }

  if (
    recommendations.critical.length === 0 &&
    recommendations.high.length === 0 &&
    recommendations.medium.length === 0 &&
    recommendations.low.length === 0
  ) {
    content += `## ✅ Great Job!\n\n`;
    content += `No major architectural issues found. Your codebase is well-structured!\n\n`;
  }

  return content;
}

function saveAnalysisResults(
  analysisDir,
  workspace,
  dependencyGraph,
  dependencyAnalysis,
  recommendations
) {
  try {
    // 1. Основной отчет
    const summaryContent = generateSummaryReport(
      workspace,
      dependencyGraph,
      dependencyAnalysis,
      recommendations
    );
    fs.writeFileSync(`${analysisDir}/analysis-summary.md`, summaryContent);

    // 2. Детали компонентов
    const componentsContent = generateComponentsReport(workspace);
    fs.writeFileSync(`${analysisDir}/components-details.md`, componentsContent);

    // 3. Детали сервисов
    const servicesContent = generateServicesReport(workspace);
    fs.writeFileSync(`${analysisDir}/services-details.md`, servicesContent);

    // 4. Отчет по зависимостям
    const dependenciesContent = generateDependenciesReport(dependencyAnalysis, dependencyGraph);
    fs.writeFileSync(`${analysisDir}/dependencies-report.md`, dependenciesContent);

    // 5. Рекомендации
    const recommendationsContent = generateRecommendationsReport(recommendations);
    fs.writeFileSync(`${analysisDir}/recommendations.md`, recommendationsContent);

    console.log('✅ All analysis files saved successfully!');
  } catch (error) {
    console.error('❌ Failed to save analysis results:', error.message);
  }
}

function analyzeCoupling(graph) {
  const result = {
    highCoupling: [],
    isolated: [],
  };

  // Анализ компонентов
  graph.components.forEach((comp) => {
    const depCount = graph.edges.filter((edge) => edge.from === comp.name).length;
    if (depCount >= 3) {
      result.highCoupling.push({ name: comp.name, dependencies: depCount });
    }
    if (depCount === 0) {
      result.isolated.push({ name: comp.name, dependencies: depCount });
    }
  });

  // Анализ модулей
  graph.modules.forEach((mod) => {
    const depCount = graph.edges.filter((edge) => edge.from === mod.name).length;
    if (depCount >= 5) {
      result.highCoupling.push({ name: mod.name, dependencies: depCount });
    }
  });

  return result;
}

function generateArchitectureRecommendations(workspace, dependencyGraph, dependencyAnalysis) {
  const recommendations = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  // Анализ компонентов
  const components = workspace.getAllComponents();
  components.forEach((comp) => {
    // Критические проблемы
    if (comp.metrics.complexity > 20) {
      recommendations.critical.push(
        `${comp.name}: Extremely high complexity (${comp.metrics.complexity}). Break down immediately.`
      );
    }

    if (comp.metrics.codeLines > 500) {
      recommendations.critical.push(
        `${comp.name}: Too large (${comp.metrics.codeLines} lines). Split into multiple components.`
      );
    }

    // Высокий приоритет
    if (comp.analysis.issues.includes('Too many providers') || comp.getProviders().length > 3) {
      recommendations.high.push(`${comp.name}: Move providers to module level to reduce coupling.`);
    }

    if (comp.metadata.template && comp.metadata.template.length > 2000) {
      recommendations.high.push(`${comp.name}: Extract large inline template to separate file.`);
    }

    // Средний приоритет
    if (comp.metrics.complexity > 10) {
      recommendations.medium.push(`${comp.name}: Consider extracting complex logic to service.`);
    }

    if (comp.metrics.imports > 15) {
      recommendations.medium.push(`${comp.name}: Too many imports. Consider using barrel exports.`);
    }
  });

  // Анализ сервисов
  const services = workspace.getAllInjectable();
  services.forEach((service) => {
    if (service.metrics.methods > 15) {
      recommendations.critical.push(
        `${service.name}: Too many methods (${service.metrics.methods}). Violates Single Responsibility Principle.`
      );
    }

    if (service.metrics.dependencies > 7) {
      recommendations.high.push(
        `${service.name}: Too many dependencies (${service.metrics.dependencies}). Consider dependency injection refactoring.`
      );
    }

    if (service.metrics.complexity > 20) {
      recommendations.high.push(
        `${service.name}: High complexity. Extract methods or split service.`
      );
    }

    if (service.metrics.codeLines > 300) {
      recommendations.medium.push(
        `${service.name}: Large service. Consider splitting responsibilities.`
      );
    }
  });

  // Анализ модулей
  const modules = workspace.getAllModules();
  modules.forEach((mod) => {
    if (mod.metrics.declarations > 30) {
      recommendations.critical.push(
        `${mod.name}: Too many declarations (${mod.metrics.declarations}). Split module.`
      );
    }

    if (mod.metrics.providers > 15) {
      recommendations.high.push(`${mod.name}: Too many providers. Move to core/shared module.`);
    }

    if (mod.metrics.moduleImports > 20) {
      recommendations.medium.push(`${mod.name}: Many imports. Consider shared modules or barrels.`);
    }
  });

  // Анализ зависимостей
  if (dependencyAnalysis.problematicDeps.length > 0) {
    dependencyAnalysis.problematicDeps.forEach((dep) => {
      recommendations.high.push(`${dep.file}: ${dep.issue} - ${dep.import}`);
    });
  }

  // Анализ связанности
  const couplingAnalysis = analyzeCoupling(dependencyGraph);
  couplingAnalysis.highCoupling.forEach((item) => {
    recommendations.medium.push(
      `${item.name}: High coupling (${item.dependencies} deps). Consider reducing dependencies.`
    );
  });

  return recommendations;
}

analyze();
