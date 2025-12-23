## Architecture Dumper Services (Infrastructure Layer)

This directory contains specialized services for dumping various aspects of the Angular application's architecture. These services are placed in the Infrastructure layer because they directly interact with Angular framework concerns and provide debugging utilities.

### Services:

*   `ComponentTreeDumperService`: Responsible for analyzing and dumping the Angular component hierarchy.
*   `ServiceDependencyDumperService`: Responsible for analyzing and dumping service dependencies within the application.
*   `RoutingStructureDumperService`: Responsible for analyzing and dumping the application's routing structure.
*   `CallTraceDumperService`: Responsible for enabling, disabling, adding, dumping, and clearing call traces for architectural analysis.
*   `DependencyInjectionTreeDumperService`: Responsible for analyzing and dumping the Angular Dependency Injection tree.
*   `PerformanceMetricsDumperService`: Responsible for collecting and dumping various performance metrics of the application.

### Architecture Principles:

These services follow Hexagonal Architecture by:
- Being placed in the Infrastructure layer where framework-specific concerns belong
- Being orchestrated by the `ArchitectureDumperService` in the Application layer
- Providing concrete implementations of debugging utilities

### Usage:

These services are coordinated by the `ArchitectureDumperService` orchestrator. Global utility functions are available via the `window` object when `initializeArchitectureDumper` is called:

*   `dumpArchitecture()`: Dumps the complete application architecture
*   `enableArchitectureTracing()`: Enables call tracing
*   `disableArchitectureTracing()`: Disables call tracing
*   `clearArchitectureTraces()`: Clears all recorded call traces
*   `exportArchitecture()`: Exports architecture data as JSON