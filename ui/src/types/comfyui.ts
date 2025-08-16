/**
 * ComfyUI type definitions for extension integration
 */

// LiteGraph interface for node creation
export interface LiteGraphNode {
  title: string;
  pos: [number, number];
  widgets?: Array<{
    name: string;
    value: any;
    type: string;
  }>;
  inputs?: Array<{
    name: string;
    type: string;
  }>;
  outputs?: Array<{
    name: string;
    type: string;
  }>;
}

export interface LiteGraph {
  createNode: (type: string) => LiteGraphNode;
}

// ComfyUI App interface
export interface ComfyUIApp {
  toast?: (
    message: string,
    options?: {
      type?: string;
      title?: string;
      timeout?: number;
    }
  ) => void;
  extensionManager?: {
    registerSidebarTab?: (config: unknown) => void;
    toast?: (
      message: string,
      options?: {
        type?: 'info' | 'success' | 'error' | 'warning';
        timeout?: number;
      }
    ) => void;
  };
  registerExtension?: (config: unknown) => void;
  ui?: {
    dialog?: {
      show: (options: {
        type?: 'info' | 'success' | 'error' | 'warning';
        content: string;
        title?: string;
      }) => void;
    };
    settings?: {
      addSetting: (config: any) => void;
    };
  };
  version?: string;
  graph?: {
    add: (node: any) => void;
    setDirtyCanvas: (dirty: boolean) => void;
    nodes?: any[];
    links?: any[];
  };
  canvas?: {
    canvas?: HTMLCanvasElement;
    ds?: {
      offset: [number, number];
      scale: number;
    };
  };
}

// Global declarations
declare global {
  interface Window {
    app?: ComfyUIApp;
    LiteGraph?: LiteGraph;
  }
}