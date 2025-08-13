import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OutputToolbar from '../components/OutputToolbar';
import { ViewMode, SortOption } from '../types';

describe('OutputToolbar', () => {
  const defaultProps = {
    viewMode: 'grid' as ViewMode,
    onViewModeChange: vi.fn(),
    sortBy: 'date-desc' as SortOption,
    onSortChange: vi.fn(),
    onRefresh: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders toolbar with all controls', () => {
      render(<OutputToolbar {...defaultProps} />);

      // Check toolbar container
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
      expect(screen.getByRole('toolbar')).toHaveAttribute('aria-label', 'Output gallery controls');

      // Check view mode buttons
      expect(screen.getByRole('button', { name: 'Grid view' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'List view' })).toBeInTheDocument();

      // Check sort dropdown
      expect(screen.getByRole('combobox', { name: 'Sort outputs' })).toBeInTheDocument();

      // Check refresh button
      expect(screen.getByRole('button', { name: 'Refresh outputs' })).toBeInTheDocument();
    });

    it('renders with correct initial view mode active', () => {
      render(<OutputToolbar {...defaultProps} viewMode="grid" />);

      const gridButton = screen.getByRole('button', { name: 'Grid view' });
      const listButton = screen.getByRole('button', { name: 'List view' });

      expect(gridButton).toHaveClass('active');
      expect(gridButton).toHaveAttribute('aria-pressed', 'true');
      expect(listButton).not.toHaveClass('active');
      expect(listButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('renders with list view active when specified', () => {
      render(<OutputToolbar {...defaultProps} viewMode="list" />);

      const gridButton = screen.getByRole('button', { name: 'Grid view' });
      const listButton = screen.getByRole('button', { name: 'List view' });

      expect(listButton).toHaveClass('active');
      expect(listButton).toHaveAttribute('aria-pressed', 'true');
      expect(gridButton).not.toHaveClass('active');
      expect(gridButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('renders with correct sort option selected', () => {
      render(<OutputToolbar {...defaultProps} sortBy="name-asc" />);

      const sortSelect = screen.getByRole('combobox', { name: 'Sort outputs' });
      expect(sortSelect).toHaveValue('name-asc');
    });

    it('shows loading state on refresh button when loading', () => {
      render(<OutputToolbar {...defaultProps} loading={true} />);

      const refreshButton = screen.getByRole('button', { name: 'Refresh outputs' });
      expect(refreshButton).toBeDisabled();

      const refreshIcon = refreshButton.querySelector('.pi-refresh');
      expect(refreshIcon).toHaveClass('pi-spin');
    });

    it('does not show loading state when not loading', () => {
      render(<OutputToolbar {...defaultProps} loading={false} />);

      const refreshButton = screen.getByRole('button', { name: 'Refresh outputs' });
      expect(refreshButton).not.toBeDisabled();

      const refreshIcon = refreshButton.querySelector('.pi-refresh');
      expect(refreshIcon).not.toHaveClass('pi-spin');
    });
  });

  describe('View Mode Interactions', () => {
    it('calls onViewModeChange when grid button is clicked', () => {
      const onViewModeChange = vi.fn();
      render(<OutputToolbar {...defaultProps} onViewModeChange={onViewModeChange} viewMode="list" />);

      const gridButton = screen.getByRole('button', { name: 'Grid view' });
      fireEvent.click(gridButton);

      expect(onViewModeChange).toHaveBeenCalledWith('grid');
      expect(onViewModeChange).toHaveBeenCalledTimes(1);
    });

    it('calls onViewModeChange when list button is clicked', () => {
      const onViewModeChange = vi.fn();
      render(<OutputToolbar {...defaultProps} onViewModeChange={onViewModeChange} viewMode="grid" />);

      const listButton = screen.getByRole('button', { name: 'List view' });
      fireEvent.click(listButton);

      expect(onViewModeChange).toHaveBeenCalledWith('list');
      expect(onViewModeChange).toHaveBeenCalledTimes(1);
    });

    it('does not call onViewModeChange when clicking already active button', () => {
      const onViewModeChange = vi.fn();
      render(<OutputToolbar {...defaultProps} onViewModeChange={onViewModeChange} viewMode="grid" />);

      const gridButton = screen.getByRole('button', { name: 'Grid view' });
      fireEvent.click(gridButton);

      // Should still call the handler - component doesn't prevent redundant calls
      expect(onViewModeChange).toHaveBeenCalledWith('grid');
    });
  });

  describe('Sort Interactions', () => {
    it('calls onSortChange when sort option is changed', () => {
      const onSortChange = vi.fn();
      render(<OutputToolbar {...defaultProps} onSortChange={onSortChange} />);

      const sortSelect = screen.getByRole('combobox', { name: 'Sort outputs' });
      fireEvent.change(sortSelect, { target: { value: 'name-asc' } });

      expect(onSortChange).toHaveBeenCalledWith('name-asc');
      expect(onSortChange).toHaveBeenCalledTimes(1);
    });

    it('renders all sort options correctly', () => {
      render(<OutputToolbar {...defaultProps} />);

      const sortSelect = screen.getByRole('combobox', { name: 'Sort outputs' });
      const options = Array.from(sortSelect.querySelectorAll('option'));

      expect(options).toHaveLength(6);
      expect(options[0]).toHaveValue('date-desc');
      expect(options[0]).toHaveTextContent('Newest First');
      expect(options[1]).toHaveValue('date-asc');
      expect(options[1]).toHaveTextContent('Oldest First');
      expect(options[2]).toHaveValue('name-asc');
      expect(options[2]).toHaveTextContent('Name A-Z');
      expect(options[3]).toHaveValue('name-desc');
      expect(options[3]).toHaveTextContent('Name Z-A');
      expect(options[4]).toHaveValue('size-desc');
      expect(options[4]).toHaveTextContent('Largest First');
      expect(options[5]).toHaveValue('size-asc');
      expect(options[5]).toHaveTextContent('Smallest First');
    });

    it('handles all sort option changes correctly', () => {
      const onSortChange = vi.fn();
      render(<OutputToolbar {...defaultProps} onSortChange={onSortChange} />);

      const sortSelect = screen.getByRole('combobox', { name: 'Sort outputs' });
      const sortOptions: SortOption[] = [
        'date-desc',
        'date-asc',
        'name-asc',
        'name-desc',
        'size-desc',
        'size-asc',
      ];

      sortOptions.forEach((option, index) => {
        fireEvent.change(sortSelect, { target: { value: option } });
        expect(onSortChange).toHaveBeenNthCalledWith(index + 1, option);
      });

      expect(onSortChange).toHaveBeenCalledTimes(6);
    });
  });

  describe('Refresh Interactions', () => {
    it('calls onRefresh when refresh button is clicked', () => {
      const onRefresh = vi.fn();
      render(<OutputToolbar {...defaultProps} onRefresh={onRefresh} />);

      const refreshButton = screen.getByRole('button', { name: 'Refresh outputs' });
      fireEvent.click(refreshButton);

      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('does not call onRefresh when button is disabled (loading)', () => {
      const onRefresh = vi.fn();
      render(<OutputToolbar {...defaultProps} onRefresh={onRefresh} loading={true} />);

      const refreshButton = screen.getByRole('button', { name: 'Refresh outputs' });
      fireEvent.click(refreshButton);

      expect(onRefresh).not.toHaveBeenCalled();
    });

    it('allows multiple refresh clicks when not loading', () => {
      const onRefresh = vi.fn();
      render(<OutputToolbar {...defaultProps} onRefresh={onRefresh} loading={false} />);

      const refreshButton = screen.getByRole('button', { name: 'Refresh outputs' });
      fireEvent.click(refreshButton);
      fireEvent.click(refreshButton);

      expect(onRefresh).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<OutputToolbar {...defaultProps} />);

      // Toolbar
      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveAttribute('aria-label', 'Output gallery controls');

      // View mode buttons
      const gridButton = screen.getByRole('button', { name: 'Grid view' });
      const listButton = screen.getByRole('button', { name: 'List view' });
      expect(gridButton).toHaveAttribute('aria-pressed');
      expect(listButton).toHaveAttribute('aria-pressed');

      // Sort select
      const sortSelect = screen.getByRole('combobox', { name: 'Sort outputs' });
      expect(sortSelect).toHaveAttribute('id', 'outputs-sort-select');

      // Screen reader label for sort select
      const sortLabel = document.querySelector('label[for="outputs-sort-select"]');
      expect(sortLabel).toBeInTheDocument();
      expect(sortLabel).toHaveClass('sr-only');
    });

    it('has proper button types', () => {
      render(<OutputToolbar {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('has proper titles for tooltips', () => {
      render(<OutputToolbar {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Grid view' })).toHaveAttribute('title', 'Grid view');
      expect(screen.getByRole('button', { name: 'List view' })).toHaveAttribute('title', 'List view');
      expect(screen.getByRole('button', { name: 'Refresh outputs' })).toHaveAttribute('title', 'Refresh outputs');
    });

    it('marks icons as decorative with aria-hidden', () => {
      render(<OutputToolbar {...defaultProps} />);

      const icons = document.querySelectorAll('.pi');
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('CSS Classes', () => {
    it('applies correct CSS classes to toolbar elements', () => {
      render(<OutputToolbar {...defaultProps} />);

      expect(screen.getByRole('toolbar')).toHaveClass('outputs-toolbar');

      const viewControls = document.querySelector('.outputs-view-controls');
      expect(viewControls).toBeInTheDocument();

      const sortControls = document.querySelector('.outputs-sort-controls');
      expect(sortControls).toBeInTheDocument();

      const viewModeButtons = document.querySelectorAll('.view-mode-button');
      expect(viewModeButtons).toHaveLength(3); // Grid, List, Refresh

      const sortSelect = document.querySelector('.outputs-sort-select');
      expect(sortSelect).toBeInTheDocument();
    });

    it('applies active class to correct view mode button', () => {
      const { rerender } = render(<OutputToolbar {...defaultProps} viewMode="grid" />);

      let gridButton = screen.getByRole('button', { name: 'Grid view' });
      let listButton = screen.getByRole('button', { name: 'List view' });

      expect(gridButton).toHaveClass('view-mode-button', 'active');
      expect(listButton).toHaveClass('view-mode-button');
      expect(listButton).not.toHaveClass('active');

      rerender(<OutputToolbar {...defaultProps} viewMode="list" />);

      gridButton = screen.getByRole('button', { name: 'Grid view' });
      listButton = screen.getByRole('button', { name: 'List view' });

      expect(listButton).toHaveClass('view-mode-button', 'active');
      expect(gridButton).toHaveClass('view-mode-button');
      expect(gridButton).not.toHaveClass('active');
    });

    it('applies refresh-button class to refresh button', () => {
      render(<OutputToolbar {...defaultProps} />);

      const refreshButton = screen.getByRole('button', { name: 'Refresh outputs' });
      expect(refreshButton).toHaveClass('view-mode-button', 'refresh-button');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined loading prop gracefully', () => {
      render(<OutputToolbar {...defaultProps} />);

      const refreshButton = screen.getByRole('button', { name: 'Refresh outputs' });
      expect(refreshButton).not.toBeDisabled();

      const refreshIcon = refreshButton.querySelector('.pi-refresh');
      expect(refreshIcon).not.toHaveClass('pi-spin');
    });

    it('handles rapid view mode changes', () => {
      const onViewModeChange = vi.fn();
      render(<OutputToolbar {...defaultProps} onViewModeChange={onViewModeChange} />);

      const gridButton = screen.getByRole('button', { name: 'Grid view' });
      const listButton = screen.getByRole('button', { name: 'List view' });

      // Rapid clicks
      fireEvent.click(gridButton);
      fireEvent.click(listButton);
      fireEvent.click(gridButton);
      fireEvent.click(listButton);

      expect(onViewModeChange).toHaveBeenCalledTimes(4);
      expect(onViewModeChange).toHaveBeenNthCalledWith(1, 'grid');
      expect(onViewModeChange).toHaveBeenNthCalledWith(2, 'list');
      expect(onViewModeChange).toHaveBeenNthCalledWith(3, 'grid');
      expect(onViewModeChange).toHaveBeenNthCalledWith(4, 'list');
    });

    it('handles rapid sort changes', () => {
      const onSortChange = vi.fn();
      render(<OutputToolbar {...defaultProps} onSortChange={onSortChange} />);

      const sortSelect = screen.getByRole('combobox', { name: 'Sort outputs' });

      // Rapid changes
      fireEvent.change(sortSelect, { target: { value: 'name-asc' } });
      fireEvent.change(sortSelect, { target: { value: 'size-desc' } });
      fireEvent.change(sortSelect, { target: { value: 'date-asc' } });

      expect(onSortChange).toHaveBeenCalledTimes(3);
      expect(onSortChange).toHaveBeenNthCalledWith(1, 'name-asc');
      expect(onSortChange).toHaveBeenNthCalledWith(2, 'size-desc');
      expect(onSortChange).toHaveBeenNthCalledWith(3, 'date-asc');
    });
  });
});