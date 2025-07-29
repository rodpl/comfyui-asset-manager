import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OutputsTab from '../OutputsTab';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'tabs.outputs': 'Outputs',
        'tabs.outputsDescription': 'View and manage your generated images',
        'content.outputs.placeholder': 'No outputs found. Generate some images to see them here.',
      };
      return translations[key] || key;
    },
  }),
}));

describe('OutputsTab', () => {
  it('renders the outputs tab with header', () => {
    render(<OutputsTab />);

    expect(screen.getByText('Outputs')).toBeInTheDocument();
    expect(screen.getByText('View and manage your generated images')).toBeInTheDocument();
  });

  it('shows placeholder content when no outputs are available', () => {
    render(<OutputsTab />);

    expect(
      screen.getByText('No outputs found. Generate some images to see them here.')
    ).toBeInTheDocument();
  });

  it('renders with correct CSS classes', () => {
    const { container } = render(<OutputsTab />);

    expect(container.querySelector('.tab-panel')).toBeInTheDocument();
    expect(container.querySelector('.tab-panel-header')).toBeInTheDocument();
    expect(container.querySelector('.tab-panel-content')).toBeInTheDocument();
    expect(container.querySelector('.placeholder-content')).toBeInTheDocument();
  });
});
