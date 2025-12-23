## Architecture Dumper Services

The architecture dumping functionality has been moved to the Infrastructure layer (`src/app/infrastructure/services/`) to follow Hexagonal Architecture principles. This directory contains the orchestrator service that coordinates the specialized dumper services.

### Services:

*   `ComponentTreeDumperService`: Responsible for analyzing and dumping the Angular component hierarchy.
*   `ServiceDependencyDumperService`: Responsible for analyzing and dumping service dependencies within the application.
*   `RoutingStructureDumperService`: Responsible for analyzing and dumping the application's routing structure.
*   `CallTraceDumperService`: Responsible for enabling, disabling, adding, dumping, and clearing call traces for architectural analysis.
*   `DependencyInjectionTreeDumperService`: Responsible for analyzing and dumping the Angular Dependency Injection tree.
*   `PerformanceMetricsDumperService`: Responsible for collecting and dumping various performance metrics of the application.

### Usage:

The `initializeArchitectureDumper` function initializes global utility functions for architectural dumping, which can be accessed via the `window` object in the browser's developer console:

*   `dumpArchitecture()`: Dumps the complete application architecture by coordinating all specialized dumper services.
*   `enableArchitectureTracing()`: Enables call tracing.
*   `disableArchitectureTracing()`: Disables call tracing.
*   `clearArchitectureTraces()`: Clears all recorded call traces.
*   `exportArchitecture()`: Exports the complete architecture data as a JSON string.
