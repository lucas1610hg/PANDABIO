import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProductsSection } from '../../components/ProductsSection';
import { ProductItem } from '../../types';

const products: ProductItem[] = [
  {
    id: 'active-product',
    name: 'Camiseta Panda',
    price: 59.9,
    salesCount: 3,
    status: 'active',
    sourceUrl: 'https://loja.example.com/camiseta',
  },
  {
    id: 'draft-product',
    name: 'Caneca Panda',
    price: 29.9,
    salesCount: 0,
    status: 'draft',
  },
];

const renderProductsSection = () =>
  render(
    <ProductsSection
      products={products}
      onToggleProduct={vi.fn()}
      onCreateProduct={vi.fn()}
      onAddProduct={vi.fn()}
      onEditProduct={vi.fn()}
    />,
  );

describe('ProductsSection', () => {
  it('shows an explicit status for active and draft products', () => {
    renderProductsSection();

    expect(screen.getByText('Ativo')).toBeTruthy();
    expect(screen.getByText('Rascunho')).toBeTruthy();
  });

  it('searches by source link as well as product name', async () => {
    const user = userEvent.setup();
    renderProductsSection();

    await user.type(
      screen.getByRole('searchbox', { name: 'Buscar produtos por nome ou link' }),
      'loja.example.com',
    );

    expect(screen.getByText('Camiseta Panda')).toBeTruthy();
    expect(screen.queryByText('Caneca Panda')).toBeNull();
  });
});
