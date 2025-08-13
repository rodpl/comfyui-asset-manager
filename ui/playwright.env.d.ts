/// <reference types="@playwright/test" />

declare namespace NodeJS {
  interface ProcessEnv {
    PLAYWRIGHT_BASE_URL?: string;
  }
}
