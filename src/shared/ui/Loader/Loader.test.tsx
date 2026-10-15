import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Loader } from './Loader';

describe('Loader', () => {
  it('covers the screen by default and shows the logo', () => {
    const { container } = render(<Loader />);
    expect(container.firstChild).toHaveClass('loader_fullscreen');
    expect(screen.getByAltText('Car')).toBeInTheDocument();
    expect(screen.getByAltText('Logo')).toBeInTheDocument();
  });

  it('renders inline when not full screen', () => {
    const { container } = render(<Loader fullScreen={false} />);
    expect(container.firstChild).toHaveClass('loader_inline');
    expect(container.firstChild).not.toHaveClass('loader_fullscreen');
  });
});
