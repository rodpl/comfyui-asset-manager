import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

// Define fallback translations for debugging
interface TranslationResource {
  [language: string]: {
    [namespace: string]: {
      app: {
        title: string;
        description: string;
      };
      tabs: {
        localAssets: string;
        localAssetsDescription: string;
        modelBrowser: string;
        modelBrowserDescription: string;
        outputs: string;
        outputsDescription: string;
      };
      content: {
        localAssets: {
          placeholder: string;
        };
        modelBrowser: {
          placeholder: string;
        };
        outputs: {
          placeholder: string;
        };
      };
    };
  };
}

const fallbackResources: TranslationResource = {
  en: {
    main: {
      app: {
        title: 'Asset Manager (Fallback)',
        description:
          'Comprehensive asset management for ComfyUI - organize local assets, browse models, and manage outputs',
      },
      tabs: {
        localAssets: 'Local Assets',
        localAssetsDescription:
          'Manage and organize your local ComfyUI assets including models, checkpoints, and custom nodes',
        modelBrowser: 'Model Browser',
        modelBrowserDescription:
          'Browse and download models from CivitAI, HuggingFace, and other platforms',
        outputs: 'Outputs',
        outputsDescription: 'View and manage your ComfyUI generated images and outputs',
      },
      content: {
        localAssets: {
          placeholder:
            "Local assets management functionality will be implemented here. You'll be able to organize models, checkpoints, and other assets.",
        },
        modelBrowser: {
          placeholder:
            'Model browser functionality will be implemented here. Browse and download models from various platforms.',
        },
        outputs: {
          placeholder:
            'Output management functionality will be implemented here. View and organize your generated images.',
        },
      },
    },
  },
};

// Initialize i18next
void i18n
  // Load translations via http backend (must be first!)
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Initialize react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Always enable debug mode to see what's happening
    debug: true,

    // Fallback language - English is the primary fallback
    fallbackLng: 'en',

    // Namespace for translations
    ns: ['main'],
    defaultNS: 'main',

    // Do not load from bundled resources first
    initImmediate: true,

    // Custom handling for missing keys
    saveMissing: true,
    missingKeyHandler: (lng, ns, key) => {
      console.log(`Missing translation: [${lng}] ${ns}:${key}`);
    },

    // Language detection configuration
    detection: {
      // Order of detection methods
      order: ['navigator', 'htmlTag', 'path', 'subdomain'],
      // Don't cache detected language
      caches: [],
    },

    // Backend configuration
    backend: {
      // Path to load translations from
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      // Add retry logic
      requestOptions: {
        retry: 3,
        timeout: 3000,
      },
    },

    // React specific options
    react: {
      useSuspense: true,
    },

    // Allow string formatting for dynamic values
    interpolation: {
      escapeValue: false, // Not needed for React as it escapes by default
    },
  });

// Add fallback resources only if HTTP loading fails
i18n.on('failedLoading', (lng, ns) => {
  console.log(`Failed loading translation file for ${lng} and ${ns}, using fallback`);

  // Add the fallback resources for this language
  if (fallbackResources[lng] && fallbackResources[lng][ns]) {
    i18n.addResourceBundle(lng, ns, fallbackResources[lng][ns], true, true);
  }
});

export default i18n;
