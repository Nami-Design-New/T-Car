import { useDirection } from '@radix-ui/react-direction';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DirectionProvider } from './DirectionProvider';

function DirectionProbe() {
  return <span>{useDirection()}</span>;
}

describe('DirectionProvider', () => {
  it('gives Radix primitives the page direction', () => {
    const { rerender } = render(
      <DirectionProvider dir="rtl">
        <DirectionProbe />
      </DirectionProvider>
    );
    expect(screen.getByText('rtl')).toBeInTheDocument();

    rerender(
      <DirectionProvider dir="ltr">
        <DirectionProbe />
      </DirectionProvider>
    );
    expect(screen.getByText('ltr')).toBeInTheDocument();
  });
});
