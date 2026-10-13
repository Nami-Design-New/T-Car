import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../../../messages/en.json';
import { describe, expect, it } from 'vitest';
import ContactInfo from './ContactInfo';

describe('ContactInfo', () => {
  it('renders contact values from the contact namespace', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ContactInfo />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('+966 500000000')).toBeInTheDocument();
    expect(screen.getByText('info@tcar.com')).toBeInTheDocument();
    expect(screen.getByText('Riyadh, Saudi Arabia')).toBeInTheDocument();
  });
});
