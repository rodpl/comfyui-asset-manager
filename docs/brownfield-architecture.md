
# ComfyUI Asset Manager Brownfield Architecture Document

## Introduction

This document captures the CURRENT STATE of the ComfyUI Asset Manager codebase, including technical debt, workarounds, and real-world patterns. It serves as a reference for AI agents working on enhancements.

### Document Scope

Comprehensive documentation of entire system.

### Change Log

| Date   | Version | Description                 | Author    |
| ------ | ------- | --------------------------- | --------- |
| 2025-09-07 | 1.0     | Initial brownfield analysis | Architect |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

- **Main Entry**: `src/main.py` - Main application entry point for the Python backend.
- **Configuration**: `src/config.py` - Application configuration.
- **Core Business Logic**: `src/domain/services/` - Services for external model, folder, metadata, model, and output management.
- **API Definitions**: `src/adapters/driving/web_api_adapter.py` - Web API adapter for handling requests.
- **Database Models**: `src/domain/entities/` - Entities like base.py, external_metadata.py, external_model.py, folder.py, model.py, output.py.
- **Key Algorithms**: `src/domain/services/external_model_service.py` - Handles model operations; `src/domain/services/output_service.py` - Manages output sorting and filtering.

### If PRD Provided - Enhancement Impact Areas

No PRD provided, so no specific enhancement impact areas.

## High Level Architecture

### Technical Summary

The ComfyUI Asset Manager is a full-stack application with a Python backend using aiohttp for asynchronous web services and a React frontend with TypeScript for the user interface. It manages assets for ComfyUI, including models, outputs, and metadata from sources like CivitAI and Hugging Face. The backend uses a hexagonal architecture with domain entities, ports, and adapters for driven (repositories) and driving (API) components. The frontend is a single-page application (SPA) with components for model browsing, outputs, and local assets management. Integration between frontend and backend is via REST API.

### Actual Tech Stack (from package.json/requirements.txt)

| Category  | Technology | Version | Notes                      |
| --------- | ---------- | ------- | -------------------------- |
| Runtime   | Python     | >=3.12  | Backend runtime.           |
| Framework | aiohttp     | ^3.12.14| Asynchronous web framework for backend. |
| Image Processing | Pillow    | ^11.0.0 | For handling asset images. |
| Frontend  | React      | N/A     | Frontend framework (inferred from .tsx files). |
| Frontend Language | TypeScript | N/A     | Used in UI.                |
| Package Manager | Poetry    | N/A     | For Python dependencies.   |
| Frontend Package Manager | pnpm     | N/A     | For UI dependencies.       |
| Testing   | pytest     | ^8.2    | Backend testing.           |
| Frontend Testing | Playwright| N/A     | E2E testing for UI.        |

## Source Tree and Module Organization

### Project Structure (Actual)

```
comfyui-asset-manager/
├── src/
│   ├── __init__.py
│   ├── config.py
│   ├── container.py
│   ├── main.py
│   ├── adapters/
│   │   ├── __init__.py
│   │   ├── driven/
│   │   │   ├── __init__.py
│   │   │   ├── civitai_external_model_adapter.py
│   │   │   ├── civitai_metadata_adapter.py
│   │   │   ├── combined_external_model_adapter.py
│   │   │   ├── comfyui_folder_adapter.py
│   │   │   ├── comfyui_output_adapter.py
│   │   │   ├── file_cache_adapter.py
│   │   │   ├── filesystem_model_adapter.py
│   │   │   ├── filesystem_output_adapter.py
│   │   │   ├── huggingface_external_model_adapter.py
│   │   │   └── huggingface_metadata_adapter.py
│   │   └── driving/
│   │       ├── __init__.py
│   │       └── web_api_adapter.py
│   ├── domain/
│   │   ├── __init__.py
│   │   ├── entities/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── external_metadata.py
│   │   │   ├── external_model.py
│   │   │   ├── folder.py
│   │   │   ├── model.py
│   │   │   └── output.py
│   │   ├── ports/
│   │   │   ├── __init__.py
│   │   │   ├── driven/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── cache_port.py
│   │   │   │   ├── external_metadata_port.py
│   │   │   │   ├── external_model_port.py
│   │   │   │   ├── folder_repository_port.py
│   │   │   │   ├── model_repository_port.py
│   │   │   │   └── output_repository_port.py
│   │   │   └── driving/
│   │   │       ├── __init__.py
│   │   │       ├── external_model_management_port.py
│   │   │       ├── folder_management_port.py
│   │   │       ├── model_management_port.py
│   │   │       └── output_management_port.py
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── external_model_service.py
│   │       ├── folder_service.py
│   │       ├── metadata_service.py
│   │       ├── model_service.py
│   │       └── output_service.py
│   └── utils/
│       ├── __init__.py
│       └── logger.py
├── ui/
│   ├── .eslintrc.cjs
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── package.json
│   ├── playwright.config.ts
│   ├── playwright.env.d.ts
│   ├── pnpm-lock.yaml
│   ├── public/
│   │   └── locales/
│   │       ├── en/
│   │       │   └── main.json
│   │       └── zh/
│   │           └── main.json
│   ├── src/
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── __tests__/
│   │   │   ├── dummy.test.tsx
│   │   │   └── README-TestFixesSummary.md
│   │   ├── components/
│   │   │   └── __tests__/
│   │   ├── contexts/
│   │   │   └── __tests__/
│   │   ├── features/
│   │   │   ├── local-assets/
│   │   │   │   ├── __tests__/
│   │   │   │   ├── components/
│   │   │   │   │   └── __tests__/
│   │   │   │   └── utils/
│   │   │   │       └── __tests__/
│   │   │   ├── model-browser/
│   │   │   │   ├── components/
│   │   │   │   │   └── __tests__/
│   │   │   │   ├── services/
│   │   │   │   │   └── __tests__/
│   │   │   │   └── utils/
│   │   │   │       └── __tests__/
│   │   │   └── outputs/
│   │   │       ├── __tests__/
│   │   │       └── components/
│   │   │           └── __tests__/
│   │   ├── hooks/
│   │   │   └── __tests__/
│   │   ├── services/
│   │   │   └── __tests__/
│   │   ├── styles/
│   │   ├── types/
│   │   └── utils/
│   │       └── __tests__/
│   └── tests-e2e/
│       └── fixtures/
│           └── components/
│               └── pageObjects/
├── tests/
│   ├── test_basic_setup.py
│   ├── adapters/
│   │   ├── __init__.py
│   │   ├── driven/
│   │   │   ├── __init__.py
│   │   │   ├── test_civitai_external_model_adapter.py
│   │   │   ├── test_civitai_metadata_adapter.py
│   │   │   ├── test_comfyui_folder_adapter.py
│   │   │   ├──