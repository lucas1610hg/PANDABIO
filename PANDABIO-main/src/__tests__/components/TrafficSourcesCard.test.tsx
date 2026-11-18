import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TrafficSourcesCard } from '../../components/TrafficSourcesCard';
import { BioLink } from '../../types';

const links: BioLink[] = [
  {
    id: 'link-a',
    title: 'Instagram',
    url: 'https://instagram.com/pandabio',
    clicks: 3,
    leads: 0,
    active: true,
    icon: 'instagram',
    type: 'social',
  },
  {
    id: 'link-b',
    title: 'Portfólio',
    url: 'https://example.com',
    clicks: 1,
    leads: 0,
    active: true,
    icon: 'custom',
    type: 'custom',
  },
];

describe('TrafficSourcesCard', () => {
  it('labels the chart as link-click distribution and shows each share', () => {
    render(<TrafficSourcesCard links={links} />);

    expect(screen.getByRole('heading', { name: 'Cliques por link' })).toBeTruthy();
    expect(screen.getByText('75%')).toBeTruthy();
    expect(screen.getByText('25%')).toBeTruthy();
  });

  it('does not show device metrics when no device data is available', () => {
    render(<TrafficSourcesCard links={[]} />);

    expect(screen.getByText('Nenhum clique recebido ainda')).toBeTruthy();
    expect(screen.queryByText(/Mobile:/)).toBeNull();
    expect(screen.queryByText(/Desktop:/)).toBeNull();
  });
});
