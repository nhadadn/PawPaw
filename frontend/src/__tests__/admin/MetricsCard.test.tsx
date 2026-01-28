import { render, screen } from '@testing-library/react';
import { MetricsCard } from '../../components/admin/MetricsCard';
import { DollarSign } from 'lucide-react';
import { describe, it, expect } from 'vitest';

describe('MetricsCard', () => {
  it('renders title and value', () => {
    render(<MetricsCard title="Total Sales" value="$1,000" icon={DollarSign} />);

    expect(screen.getByText('Total Sales')).toBeInTheDocument();
    expect(screen.getByText('$1,000')).toBeInTheDocument();
  });

  it('renders positive trend', () => {
    render(
      <MetricsCard
        title="Total Sales"
        value="$1,000"
        icon={DollarSign}
        trend={{ value: 10, isPositive: true }}
      />
    );

    expect(screen.getByText('+10%')).toBeInTheDocument();
    expect(screen.getByText('+10%')).toHaveClass('text-success');
  });

  it('renders negative trend', () => {
    render(
      <MetricsCard
        title="Total Sales"
        value="$1,000"
        icon={DollarSign}
        trend={{ value: -5, isPositive: false }}
      />
    );

    expect(screen.getByText('-5%')).toBeInTheDocument();
    expect(screen.getByText('-5%')).toHaveClass('text-error');
  });
});
