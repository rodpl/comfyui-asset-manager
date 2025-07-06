# Gemini Project Guide: ComfyUI Asset Manager

This document guides my development process for the ComfyUI Asset Manager extension.

## 1. Project Overview

The primary purpose of this ComfyUI extension is to help users manage their AI assets. Key features include:

*   Managing already downloaded AI models and other files.
*   Browsing and downloading new files from CivitAI and Hugging Face.
*   Managing outputs from the ComfyUI application.

The functionality will be similar to the Stability Matrix application.

## 2. Development Workflow

Before committing any changes, I will run the following commands:

*   `npm run lint`
*   `npm run format`

If these commands fail repeatedly, I will notify you so you can fix them manually.

## 3. Coding Style

I will follow the existing coding style and conventions in the codebase.

## 4. ComfyUI Integration

ComfyUI is using TailwindCSS and PrimeVue for UI look. Extension is written in React and must adapt CSS classes which will be loaded by main application.

## 5. General Rules

*   I will always ask for clarification if I am not at least 97% certain about something.
*   I will create a plan before implementing any changes.
*   If there are multiple options or scenarios, I will summarize them, suggest one, and describe the pros and cons of each.
