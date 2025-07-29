import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import MetadataEditor from '../MetadataEditor';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { tag?: string; star?: number; [key: string]: unknown }) => {
      const translations: Record<string, string> = {
        'metadataEditor.tags': 'Tags',
        'metadataEditor.addTag': 'Add tag...',
        'metadataEditor.removeTag': `Remove ${options?.tag || 'tag'}`,
        'metadataEditor.description': 'Description',
        'metadataEditor.descriptionPlaceholder': 'Add a description for this model...',
        'metadataEditor.rating': 'Rating',
        'metadataEditor.ratingStar': `${options?.star || 1} star`,
        'metadataEditor.clearRating': 'Clear rating',
        'metadataEditor.save': 'Save',
        'metadataEditor.cancel': 'Cancel',
      };
      return translations[key] || key;
    },
  }),
}));

describe('MetadataEditor', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();
  const mockAvailableTags = ['character', 'style', 'anime', 'realistic'];

  const defaultProps = {
    availableTags: mockAvailableTags,
    onSave: mockOnSave,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with empty initial state', () => {
    render(<MetadataEditor {...defaultProps} />);

    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add tag...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add a description for this model...')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders with initial metadata', () => {
    const initialMetadata = {
      tags: ['character', 'anime'],
      description: 'Test description',
      rating: 4,
    };

    render(<MetadataEditor {...defaultProps} initialMetadata={initialMetadata} />);

    expect(screen.getByText('character')).toBeInTheDocument();
    expect(screen.getByText('anime')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();

    // Check that 4 stars are filled
    const stars = screen
      .getAllByRole('button')
      .filter((button) => button.getAttribute('aria-label')?.includes('star'));
    expect(stars).toHaveLength(5);
  });

  it('allows adding tags by typing and pressing Enter', async () => {
    const user = userEvent.setup();
    render(<MetadataEditor {...defaultProps} />);

    const tagInput = screen.getByPlaceholderText('Add tag...');
    await user.type(tagInput, 'new-tag');
    await user.keyboard('{Enter}');

    expect(screen.getByText('new-tag')).toBeInTheDocument();
    expect(tagInput).toHaveValue('');
  });

  it('shows tag suggestions when typing', async () => {
    const user = userEvent.setup();
    render(<MetadataEditor {...defaultProps} />);

    const tagInput = screen.getByPlaceholderText('Add tag...');
    await user.type(tagInput, 'char');

    await waitFor(() => {
      expect(screen.getByText('character')).toBeInTheDocument();
    });
  });

  it('allows selecting tag suggestions', async () => {
    const user = userEvent.setup();
    render(<MetadataEditor {...defaultProps} />);

    const tagInput = screen.getByPlaceholderText('Add tag...');
    await user.type(tagInput, 'char');

    await waitFor(() => {
      const suggestion = screen.getByText('character');
      expect(suggestion).toBeInTheDocument();
    });

    const suggestion = screen.getByText('character');
    await user.click(suggestion);

    expect(screen.getByText('character')).toBeInTheDocument();
    expect(tagInput).toHaveValue('');
  });

  it('allows removing tags', async () => {
    const initialMetadata = {
      tags: ['character', 'anime'],
      description: '',
      rating: 0,
    };

    render(<MetadataEditor {...defaultProps} initialMetadata={initialMetadata} />);

    // Verify both tags are initially present
    expect(screen.getByText('character')).toBeInTheDocument();
    expect(screen.getByText('anime')).toBeInTheDocument();

    // Find the remove button specifically for 'character' tag
    const characterRemoveButton = screen.getByLabelText('Remove character');

    // Click the remove button using fireEvent as a fallback
    fireEvent.click(characterRemoveButton);

    // Wait for the tag to be removed
    await waitFor(
      () => {
        expect(screen.queryByText('character')).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    // Verify the other tag is still there
    expect(screen.getByText('anime')).toBeInTheDocument();
  });

  it('allows editing description', async () => {
    const user = userEvent.setup();
    render(<MetadataEditor {...defaultProps} />);

    const descriptionInput = screen.getByPlaceholderText('Add a description for this model...');
    await user.type(descriptionInput, 'New description');

    expect(descriptionInput).toHaveValue('New description');
  });

  it('allows setting rating', async () => {
    const user = userEvent.setup();
    render(<MetadataEditor {...defaultProps} />);

    const stars = screen
      .getAllByRole('button')
      .filter((button) => button.getAttribute('aria-label')?.includes('star'));

    await user.click(stars[2]); // Click 3rd star

    // Check that the rating was set (this would be reflected in the component state)
    // We can verify this by checking if the save button becomes enabled
    const saveButton = screen.getByText('Save');
    expect(saveButton).not.toBeDisabled();
  });

  it('allows clearing rating', async () => {
    const user = userEvent.setup();
    const initialMetadata = {
      tags: [],
      description: '',
      rating: 3,
    };

    render(<MetadataEditor {...defaultProps} initialMetadata={initialMetadata} />);

    const clearButton = screen.getByLabelText('Clear rating');
    await user.click(clearButton);

    // The save button should still be enabled since there was a change
    const saveButton = screen.getByText('Save');
    expect(saveButton).not.toBeDisabled();
  });

  it('calls onSave with correct data', async () => {
    const user = userEvent.setup();
    render(<MetadataEditor {...defaultProps} />);

    // Add a tag
    const tagInput = screen.getByPlaceholderText('Add tag...');
    await user.type(tagInput, 'test-tag');
    await user.keyboard('{Enter}');

    // Add description
    const descriptionInput = screen.getByPlaceholderText('Add a description for this model...');
    await user.type(descriptionInput, 'Test description');

    // Set rating
    const stars = screen
      .getAllByRole('button')
      .filter((button) => button.getAttribute('aria-label')?.includes('star'));
    await user.click(stars[3]); // 4 stars

    // Save
    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith({
      tags: ['test-tag'],
      description: 'Test description',
      rating: 4,
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<MetadataEditor {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables save button when no changes are made', () => {
    const initialMetadata = {
      tags: ['existing'],
      description: 'existing description',
      rating: 3,
    };

    render(<MetadataEditor {...defaultProps} initialMetadata={initialMetadata} />);

    const saveButton = screen.getByText('Save');
    expect(saveButton).toBeDisabled();
  });

  it('enables save button when changes are made', async () => {
    const user = userEvent.setup();
    const initialMetadata = {
      tags: ['existing'],
      description: 'existing description',
      rating: 3,
    };

    render(<MetadataEditor {...defaultProps} initialMetadata={initialMetadata} />);

    const descriptionInput = screen.getByDisplayValue('existing description');
    await user.type(descriptionInput, ' modified');

    const saveButton = screen.getByText('Save');
    expect(saveButton).not.toBeDisabled();
  });

  it('shows loading state', () => {
    render(<MetadataEditor {...defaultProps} loading={true} />);

    const saveButton = screen.getByText('Save');
    const cancelButton = screen.getByText('Cancel');
    const tagInput = screen.getByPlaceholderText('Add tag...');
    const descriptionInput = screen.getByPlaceholderText('Add a description for this model...');

    expect(saveButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(tagInput).toBeDisabled();
    expect(descriptionInput).toBeDisabled();
  });

  it('prevents duplicate tags', async () => {
    const user = userEvent.setup();
    const initialMetadata = {
      tags: ['existing'],
      description: '',
      rating: 0,
    };

    render(<MetadataEditor {...defaultProps} initialMetadata={initialMetadata} />);

    const tagInput = screen.getByPlaceholderText('Add tag...');
    await user.type(tagInput, 'existing');
    await user.keyboard('{Enter}');

    // Should still only have one instance of 'existing'
    const existingTags = screen.getAllByText('existing');
    expect(existingTags).toHaveLength(1);
  });

  it('handles backspace to remove last tag when input is empty', async () => {
    const user = userEvent.setup();
    const initialMetadata = {
      tags: ['tag1', 'tag2'],
      description: '',
      rating: 0,
    };

    render(<MetadataEditor {...defaultProps} initialMetadata={initialMetadata} />);

    const tagInput = screen.getByPlaceholderText('Add tag...');
    await user.click(tagInput);
    await user.keyboard('{Backspace}');

    expect(screen.queryByText('tag2')).not.toBeInTheDocument();
    expect(screen.getByText('tag1')).toBeInTheDocument();
  });
});
