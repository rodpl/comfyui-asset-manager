import React, { useEffect, useRef } from "react";
import { ContextMenuProps, ContextMenuAction } from "../types";
import "../OutputsTab.css";

const OutputContextMenu = ({
  output,
  position,
  isVisible,
  onAction,
  onClose,
}: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);

      // Focus the menu for keyboard navigation
      if (menuRef.current) {
        menuRef.current.focus();
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isVisible, onClose]);

  useEffect(() => {
    // Adjust position if menu would go off-screen
    if (isVisible && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = position.x;
      let adjustedY = position.y;

      // Adjust horizontal position if menu goes off right edge
      if (position.x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      // Adjust vertical position if menu goes off bottom edge
      if (position.y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      // Ensure menu doesn't go off left or top edges
      adjustedX = Math.max(10, adjustedX);
      adjustedY = Math.max(10, adjustedY);

      menu.style.left = `${adjustedX}px`;
      menu.style.top = `${adjustedY}px`;
    }
  }, [isVisible, position]);

  const handleMenuItemClick = (action: ContextMenuAction) => {
    onAction(action);
    onClose();
  };

  const handleMenuItemKeyDown = (
    event: React.KeyboardEvent,
    action: ContextMenuAction
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleMenuItemClick(action);
    }
  };

  if (!isVisible || !output) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="output-context-menu"
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 100000, // Ensure it's above everything else
      }}
      tabIndex={-1}
      role="menu"
      aria-label={`Context menu for ${output.filename}`}
    >
      <div className="context-menu-item" role="menuitem">
        <div className="context-menu-header">
          <i className="pi pi-image"></i>
          <span className="context-menu-filename" title={output.filename}>
            {output.filename}
          </span>
        </div>
      </div>

      <div className="context-menu-separator"></div>

      <button
        className="context-menu-item context-menu-button"
        onClick={() => handleMenuItemClick("copy-path")}
        onKeyDown={(e) => handleMenuItemKeyDown(e, "copy-path")}
        role="menuitem"
        aria-label="Copy file path to clipboard"
      >
        <i className="pi pi-copy"></i>
        <span>Copy File Path</span>
      </button>

      <button
        className="context-menu-item context-menu-button"
        onClick={() => handleMenuItemClick("open-system")}
        onKeyDown={(e) => handleMenuItemKeyDown(e, "open-system")}
        role="menuitem"
        aria-label="Open in system viewer"
      >
        <i className="pi pi-external-link"></i>
        <span>Open in System Viewer</span>
      </button>

      <button
        className="context-menu-item context-menu-button"
        onClick={() => handleMenuItemClick("show-folder")}
        onKeyDown={(e) => handleMenuItemKeyDown(e, "show-folder")}
        role="menuitem"
        aria-label="Show in folder"
      >
        <i className="pi pi-folder-open"></i>
        <span>Show in Folder</span>
      </button>
    </div>
  );
};

export default OutputContextMenu;
