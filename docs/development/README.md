# Development Documentation

## Overview

This directory contains comprehensive documentation for developers working on the ComfyUI Asset Manager. The documentation covers the hexagonal architecture implementation, current status, and practical development guidance.

## Documentation Structure

### 📚 Core Architecture Documentation

#### [Hexagonal Architecture Implementation](./hexagonal-architecture.md)
**Comprehensive guide to the architectural patterns and principles**

- **What it covers**: Complete explanation of hexagonal architecture concepts, visual diagrams, and implementation details
- **Who should read it**: All developers, especially those new to hexagonal architecture
- **Key sections**:
  - Architecture principles and core concepts
  - Layer breakdown (Domain Core, Ports, Adapters)
  - Port classification (Driving vs Driven)
  - Visual architecture diagrams with Mermaid
  - Code examples and implementation patterns
  - Benefits, trade-offs, and when to use this architecture

#### [Current Implementation Status](./current-implementation-status.md)
**Detailed overview of what's implemented, in progress, and planned**

- **What it covers**: Complete status of all components, test coverage, and next steps
- **Who should read it**: Developers joining the project or planning new features
- **Key sections**:
  - Implementation progress with completion status
  - Current architecture state with visual diagrams
  - Service implementation details and test coverage
  - Code quality metrics and architecture compliance
  - Prioritized next implementation steps
  - Architecture decisions and future considerations

#### [Developer Guide](./developer-guide.md)
**Practical guide for working with the hexagonal architecture**

- **What it covers**: Hands-on instructions, patterns, and best practices
- **Who should read it**: All developers actively working on the codebase
- **Key sections**:
  - Quick start and project navigation
  - Understanding request flow and key principles
  - Working with domain services and implementing adapters
  - Testing patterns and common development tasks
  - Troubleshooting and best practices

### 🎨 Theme Integration Documentation

#### [Theme Integration Guide](./theme-integration-guide.md)
**Comprehensive guide for implementing ComfyUI theme integration**

- **What it covers**: Complete CSS-based theme system implementation
- **Who should read it**: Frontend developers and anyone working with UI components
- **Key sections**:
  - CSS variable system and naming conventions
  - Theme detection and switching mechanisms
  - Component theming guidelines and patterns
  - Testing approaches for theme functionality
  - Troubleshooting guide and best practices

#### [Theme Integration Quick Reference](./theme-integration-quick-reference.md)
**Quick reference for common theme integration patterns**

- **What it covers**: Essential patterns, variables, and troubleshooting steps
- **Who should read it**: Developers who need quick access to theme integration patterns
- **Key sections**:
  - CSS variable reference and usage patterns
  - Common component theming patterns
  - Testing commands and debugging tools
  - Troubleshooting checklist

## Quick Navigation

### 🚀 Getting Started
- New to the project? Start with [Hexagonal Architecture Implementation](./hexagonal-architecture.md)
- Want to understand current status? Read [Current Implementation Status](./current-implementation-status.md)
- Ready to code? Use the [Developer Guide](./developer-guide.md)

### 🔍 Find Information By Topic

| Topic | Document | Section |
|-------|----------|---------|
| **Architecture Concepts** | [Hexagonal Architecture](./hexagonal-architecture.md) | Architecture Principles |
| **Port vs Adapter Distinction** | [Hexagonal Architecture](./hexagonal-architecture.md) | Port Classification |
| **Visual Diagrams** | [Hexagonal Architecture](./hexagonal-architecture.md) | Visual Architecture Diagrams |
| **What's Implemented** | [Current Implementation Status](./current-implementation-status.md) | Implementation Progress |
| **Test Coverage** | [Current Implementation Status](./current-implementation-status.md) | Code Quality Metrics |
| **Next Steps** | [Current Implementation Status](./current-implementation-status.md) | Next Implementation Steps |
| **How to Add Features** | [Developer Guide](./developer-guide.md) | Common Development Tasks |
| **Testing Patterns** | [Developer Guide](./developer-guide.md) | Testing Patterns |
| **Troubleshooting** | [Developer Guide](./developer-guide.md) | Troubleshooting |
| **Theme Integration** | [Theme Integration Guide](./theme-integration-guide.md) | Complete Guide |
| **Theme Quick Reference** | [Theme Integration Quick Reference](./theme-integration-quick-reference.md) | Quick Patterns |
| **CSS Variables** | [Theme Integration Guide](./theme-integration-guide.md) | CSS Variable System |
| **Theme Testing** | [Theme Integration Guide](./theme-integration-guide.md) | Testing Theme Integration |

### 🎯 By Role

#### **New Team Members**
1. Read [Hexagonal Architecture Implementation](./hexagonal-architecture.md) - Sections 1-4
2. Review [Current Implementation Status](./current-implementation-status.md) - Implementation Progress
3. Follow [Developer Guide](./developer-guide.md) - Quick Start

#### **Feature Developers**
1. Check [Current Implementation Status](./current-implementation-status.md) - Service Implementation Details
2. Use [Developer Guide](./developer-guide.md) - Working with Domain Services
3. Reference [Developer Guide](./developer-guide.md) - Common Development Tasks

#### **Architecture Reviewers**
1. Study [Hexagonal Architecture Implementation](./hexagonal-architecture.md) - Complete document
2. Review [Current Implementation Status](./current-implementation-status.md) - Architecture Decisions
3. Check [Current Implementation Status](./current-implementation-status.md) - Architecture Compliance

#### **QA/Testing**
1. Understand [Hexagonal Architecture Implementation](./hexagonal-architecture.md) - Implementation Flow
2. Review [Current Implementation Status](./current-implementation-status.md) - Test Coverage Summary
3. Use [Developer Guide](./developer-guide.md) - Testing Patterns
4. Reference [Theme Integration Guide](./theme-integration-guide.md) - Testing Theme Integration

#### **Frontend/UI Developers**
1. Read [Theme Integration Guide](./theme-integration-guide.md) - Complete guide
2. Use [Theme Integration Quick Reference](./theme-integration-quick-reference.md) - Daily reference
3. Follow [Developer Guide](./developer-guide.md) - General development patterns

## Key Concepts Summary

### 🏗️ Architecture Overview

The ComfyUI Asset Manager implements **Hexagonal Architecture** (Ports and Adapters pattern) with these key characteristics:

- **Domain Core**: Pure business logic (Entities, Services, Value Objects)
- **Driving Ports**: Define what the application can do (use cases)
- **Driven Ports**: Define what the application needs (dependencies)
- **Adapters**: Handle infrastructure concerns and external integrations

### 📊 Current Status

- ✅ **Domain Core**: 100% complete with comprehensive tests
- ✅ **Ports**: All interfaces defined and documented
- 🚧 **Adapters**: Partially implemented, needs completion
- ❌ **Integration**: Dependency injection and wiring needed

### 🧪 Testing Strategy

- **Unit Tests**: 64 tests with 96-100% coverage for domain services
- **Mock-based**: All dependencies mocked for isolation
- **Contract Tests**: Planned for adapter implementations
- **Integration Tests**: Needed for complete request flows

## Development Workflow

### 🔄 Typical Development Flow

1. **Understand the Architecture** → Read hexagonal architecture docs
2. **Check Current Status** → Review implementation status
3. **Plan Your Changes** → Use developer guide patterns
4. **Implement** → Follow established patterns
5. **Test** → Use provided testing patterns
6. **Review** → Ensure architecture compliance

### 📋 Before You Start Coding

- [ ] Understand hexagonal architecture principles
- [ ] Know the difference between driving and driven ports
- [ ] Understand dependency flow (always inward to domain)
- [ ] Review existing service implementations
- [ ] Set up development environment and run tests

### ✅ Code Review Checklist

- [ ] Business logic is in domain services, not adapters
- [ ] Dependencies flow inward toward domain core
- [ ] Ports are properly classified (driving vs driven)
- [ ] Comprehensive unit tests with mocks
- [ ] Input validation in domain services
- [ ] Graceful error handling
- [ ] No infrastructure imports in domain layer

## Additional Resources

### 📖 External References

- [Hexagonal Architecture (Alistair Cockburn)](https://alistair.cockburn.us/hexagonal-architecture/)
- [Clean Architecture (Robert Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Ports and Adapters Pattern](https://herbertograca.com/2017/09/14/ports-adapters-architecture/)

### 🛠️ Tools and Commands

```bash
# Run all tests
poetry run pytest tests/domain/services/ -v

# Check test coverage
poetry run pytest --cov=src/domain/services --cov-report=html

# Type checking
poetry run mypy src/

# Code formatting
poetry run black src/ tests/

# Linting
poetry run flake8 src/ tests/
```

### 🤝 Contributing

When contributing to this documentation:

1. Keep examples practical and runnable
2. Update diagrams when architecture changes
3. Maintain consistency across documents
4. Include code examples for complex concepts
5. Update the status document when implementation progresses

## Questions and Support

### 🆘 Common Questions

**Q: Should my new feature be a driving or driven port?**
A: Ask yourself: "Is this something external actors want to trigger (driving) or something the application needs from infrastructure (driven)?" See [Port Classification](./hexagonal-architecture.md#port-classification).

**Q: Where should I put business logic?**
A: Always in domain services or entities, never in adapters. See [Developer Guide](./developer-guide.md#working-with-domain-services).

**Q: How do I test my changes?**
A: Use unit tests with mocks for domain services, integration tests for adapters. See [Testing Patterns](./developer-guide.md#testing-patterns).

**Q: What's the next priority for implementation?**
A: Check [Next Implementation Steps](./current-implementation-status.md#next-implementation-steps) for prioritized tasks.

---

*This documentation is maintained alongside the codebase. Please keep it updated as the implementation evolves.*