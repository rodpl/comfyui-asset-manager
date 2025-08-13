import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OutputContextMenu } from '../components';
import { Output, ContextMenuAction } from '../types';

const mockOutput: Output = {
  id: 'output-1',
  filename: 'test-image.png',
  filePath: '/output/test-image.png',
  fileSize: 2097152, // 2MB
  createdAt: new Date('2024-01-25T14:30:00Z'),
  modifiedAt: new Date('2024-01-25T14:30:00Z'),
  imageWidth: 1024,
  imageHeight: 768,
  fileFormat: 'png',
  thumbnailPath: '/output/thumbnails/test-image.png',
};

const mockLongFilenameOutput: Output = {
  ...mockOutput,
  id: 'output-2',
  filename: 'very-long-filename-that-should-be-truncated-in-the-display-because-it-is-too-long.png',
};

describe('OutputContextMenu', () => {
  const defaultProps = {
    output: mockOutput,
    position: { x: 100, y: 200 },
    isVisible: true,
    onAction: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getBoundingClientRect for position calculations
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 200,
      height: 150,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders context menu when visible', () => {
      render(<OutputContextMenu {...defaultProps} />);

      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByText('test-image.png')).toBeInTheDocument();
      expect(screen.getByText('Copy File Path')).toBeInTheDocument();
      expect(screen.getByText('Open in System Viewer')).toBeInTheDocument();
      expect(screen.getByText('Show in Folder')).toBeInTheDocument();
    });

    it('does not render when not visible', () => {
      render(<OutputContextMenu {...defaultProps} isVisible={false} />);

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('displays filename in header', () => {
      render(<OutputContextMenu {...defaultProps} />);

      const header = screen.getByText('test-image.png');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('context-menu-filename');
    });

    it('truncates long filenames in header', () => {
      render(<OutputContextMenu {...defaultProps} output={mockLongFilenameOutput} />);

      const header = screen.getByText(mockLongFilenameOutput.filename);
      expect(header).toHaveClass('context-menu-filename');
      expect(header).toHaveAttribute('title', mockLongFilenameOutput.filename);
    });

    it('displays proper icons for each action', () => {
      render(<OutputContextMenu {...defaultProps} />);

      expect(document.querySelector('.pi-image')).toBeInTheDocument(); // Header icon
      expect(document.querySelector('.pi-copy')).toBeInTheDocument(); // Copy action
      expect(document.querySelector('.pi-external-link')).toBeInTheDocument(); // Open action
      expect(document.querySelector('.pi-folder-open')).toBeInTheDocument(); // Show folder action
    });
  });

  describe('Positioning', () => {
    it('positions menu at specified coordinates', () => {
      render(<OutputContextMenu {...defaultProps} position={{ x: 150, y: 250 }} />);

      const menu = screen.getByRole('menu');
      expect(menu).toHaveStyle({
        position: 'fixed',
        left: '150px',
        top: '250px',
      });
    });

    it('has high z-index to appear above other elements', () => {
      render(<OutputContextMenu {...defaultProps} />);

      const menu = screen.getByRole('menu');
      expect(menu).toHaveStyle({ zIndex: '100000' });
    });

    it('adjusts position when menu would go off-screen', async () => {
      // Mock window dimensions
      Object.defineProperty(window, 'innerWidth', { value: 300, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 400, writable: true });

      // Mock getBoundingClientRect to simulate menu size
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        width: 200,
        height: 150,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      }));

      // Position that would go off-screen
      render(<OutputContextMenu {...defaultProps} position={{ x: 250, y: 350 }} />);

      const menu = screen.getByRole('menu');
      
      // Wait for position adjustment effect
      await waitFor(() => {
        // Should be adjusted to stay within viewport
        const style = window.getComputedStyle(menu);
        const left = parseInt(style.left);
        const top = parseInt(style.top);
        
        expect(left).toBeLessThanOrEqual(300 - 200 - 10); // viewport width - menu width - margin
        expect(top).toBeLessThanOrEqual(400 - 150 - 10); // viewport height - menu height - margin
      });
    });
  });

  describe('User Interactions', () => {
    it('calls onAction with correct action when Copy File Path is clicked', () => {
      const onAction = vi.fn();
      render(<OutputContextMenu {...defaultProps} onAction={onAction} />);

      const copyButton = screen.getByText('Copy File Path');
      fireEvent.click(copyButton);

      expect(onAction).toHaveBeenCalledWith('copy-path');
    });

    it('calls onAction with correct action when Open in System Viewer is clicked', () => {
      const onAction = vi.fn();
      render(<OutputContextMenu {...defaultProps} onAction={onAction} />);

      const openButton = screen.getByText('Open in System Viewer');
      fireEvent.click(openButton);

      expect(onAction).toHaveBeenCalledWith('open-system');
    });

    it('calls onAction with correct action when Show in Folder is clicked', () => {
      const onAction = vi.fn();
      render(<OutputContextMenu {...defaultProps} onAction={onAction} />);

      const showFolderButton = screen.getByText('Show in Folder');
      fireEvent.click(showFolderButton);

      expect(onAction).toHaveBeenCalledWith('show-folder');
    });

    it('calls onClose after action is triggered', () => {
      const onClose = vi.fn();
      render(<OutputContextMenu {...defaultProps} onClose={onClose} />);

      const copyButton = screen.getByText('Copy File Path');
      fireEvent.click(copyButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking outside menu', () => {
      const onClose = vi.fn();
      render(
        <div>
          <div data-testid="outside">Outside element</div>
          <OutputContextMenu {...defaultProps} onClose={onClose} />
        </div>
      );

      const outsideElement = screen.getByTestId('outside');
      fireEvent.mouseDown(outsideElement);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when clicking inside menu', () => {
      const onClose = vi.fn();
      render(<OutputContextMenu {...defaultProps} onClose={onClose} />);

      const menu = screen.getByRole('menu');
      fireEvent.mouseDown(menu);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('calls onClose when Escape key is pressed', () => {
      const onClose = vi.fn();
      render(<OutputContextMenu {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('triggers action when Enter is pressed on menu item', () => {
      const onAction = vi.fn();
      render(<OutputContextMenu {...defaultProps} onAction={onAction} />);

      const copyButton = screen.getByText('Copy File Path');
      fireEvent.keyDown(copyButton, { key: 'Enter' });

      expect(onAction).toHaveBeenCalledWith('copy-path');
    });

    it('triggers action when Space is pressed on menu item', () => {
      const onAction = vi.fn();
      render(<OutputContextMenu {...defaultProps} onAction={onAction} />);

      const copyButton = screen.getByText('Copy File Path');
      fireEvent.keyDown(copyButton, { key: ' ' });

      expect(onAction).toHaveBeenCalledWith('copy-path');
    });

    it('does not trigger action for other keys', () => {
      const onAction = vi.fn();
      render(<OutputContextMenu {...defaultProps} onAction={onAction} />);

      const copyButton = screen.getByText('Copy File Path');
      fireEvent.keyDown(copyButton, { key: 'Tab' });

      expect(onAction).not.toHaveBeenCalled();
    });

    it('focuses menu when it becomes visible', async () => {
      const { rerender } = render(<OutputContextMenu {...defaultProps} isVisible={false} />);

      rerender(<OutputContextMenu {...defaultProps} isVisible={true} />);

      await waitFor(() => {
        const menu = screen.getByRole('menu');
        expect(menu).toHaveFocus();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<OutputContextMenu {...defaultProps} />);

      const menu = screen.getByRole('menu');
      expect(menu).toHaveAttribute('aria-label', 'Context menu for test-image.png');
      expect(menu).toHaveAttribute('tabindex', '-1');
    });

    it('has proper menuitem roles for action buttons', () => {
      render(<OutputContextMenu {...defaultProps} />);

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(4); // Header + 3 action buttons

      // Check action buttons have proper labels
      expect(screen.getByLabelText('Copy file path to clipboard')).toBeInTheDocument();
      expect(screen.getByLabelText('Open in system viewer')).toBeInTheDocument();
      expect(screen.getByLabelText('Show in folder')).toBeInTheDocument();
    });

    it('provides meaningful aria-labels for screen readers', () => {
      render(<OutputContextMenu {...defaultProps} />);

      expect(screen.getByLabelText('Copy file path to clipboard')).toBeInTheDocument();
      expect(screen.getByLabelText('Open in system viewer')).toBeInTheDocument();
      expect(screen.getByLabelText('Show in folder')).toBeInTheDocument();
    });
  });

  describe('Event Cleanup', () => {
    it('removes event listeners when component unmounts', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(<OutputContextMenu {...defaultProps} />);
      
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('removes event listeners when menu becomes invisible', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      
      const { rerender } = render(<OutputContextMenu {...defaultProps} isVisible={true} />);
      
      rerender(<OutputContextMenu {...defaultProps} isVisible={false} />);

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('Action Types', () => {
    it('handles all defined context menu actions', () => {
      const onAction = vi.fn();
      render(<OutputContextMenu {...defaultProps} onAction={onAction} />);

      const actions: ContextMenuAction[] = ['copy-path', 'open-system', 'show-folder'];
      const buttons = [
        screen.getByText('Copy File Path'),
        screen.getByText('Open in System Viewer'),
        screen.getByText('Show in Folder'),
      ];

      buttons.forEach((button, index) => {
        fireEvent.click(button);
        expect(onAction).toHaveBeenCalledWith(actions[index]);
      });

      expect(onAction).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    it('handles missing output gracefully', () => {
      // This shouldn't happen in practice, but test defensive programming
      const propsWithoutOutput = {
        ...defaultProps,
        output: null as any,
      };

      expect(() => {
        render(<OutputContextMenu {...propsWithoutOutput} />);
      }).not.toThrow();
    });

    it('handles invalid position coordinates', () => {
      const invalidPositionProps = {
        ...defaultProps,
        position: { x: NaN, y: NaN },
      };

      expect(() => {
        render(<OutputContextMenu {...invalidPositionProps} />);
      }).not.toThrow();
    });
  });
});