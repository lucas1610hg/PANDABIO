import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AddBlockModal } from '../../components/AddBlockModal';

function AddBlockModalHarness() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Abrir modal
      </button>
      <AddBlockModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAddBlock={() => undefined}
      />
    </>
  );
}

describe('AddBlockModal', () => {
  it('clears the previous selection when the modal is reopened', async () => {
    const user = userEvent.setup();
    render(<AddBlockModalHarness />);

    await user.click(screen.getByRole('radio', { name: /^Link/ }));
    expect(screen.getByRole('button', { name: 'Adicionar' }).hasAttribute('disabled')).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.click(screen.getByRole('button', { name: 'Abrir modal' }));

    expect(screen.getByRole('radio', { name: /^Link/ }).getAttribute('aria-checked')).toBe('false');
    expect(screen.getByRole('button', { name: 'Adicionar' }).hasAttribute('disabled')).toBe(true);
  });
});
