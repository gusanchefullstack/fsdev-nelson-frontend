import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BucketGauge, gaugeState, type GaugeBucket } from '@/components/viz/BucketGauge';

const bucket = (patch: Partial<GaugeBucket>): GaugeBucket => ({
  startDate: '2027-03-05',
  endDate: '2027-04-04',
  estimatedAmount: '5000.00',
  actualAmount: '0.00',
  status: 'PAST',
  over: false,
  currency: 'USD',
  ...patch,
});

describe('BucketGauge (FR-037)', () => {
  it('describes an over-filled bucket in words', () => {
    render(<BucketGauge name="Rent" bucket={bucket({ actualAmount: '5100.00', over: true })} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAccessibleName('Rent, Mar 5 – Apr 4: $5,100.00 of $5,000.00, over by $100.00, over');
    expect(img).toHaveAttribute('data-state', 'over');
  });

  it('distinguishes past, current and future buckets', () => {
    expect(gaugeState(bucket({ actualAmount: '5000.00' }))).toBe('on-target');
    expect(gaugeState(bucket({ actualAmount: '4000.00' }))).toBe('under');
    expect(gaugeState(bucket({ status: 'CURRENT' }))).toBe('open');
    expect(gaugeState(bucket({ status: 'FUTURE' }))).toBe('upcoming');
  });

  it('mentions a shortfall only for closed buckets', () => {
    render(<BucketGauge name="Salary" bucket={bucket({ actualAmount: '4000.00', estimatedAmount: '5000.00' })} />);
    expect(screen.getByRole('img')).toHaveAccessibleName(/under by \$1,000\.00, under$/);
  });

  it('fills proportionally and caps at the rim', () => {
    const { container, rerender } = render(<BucketGauge name="Rent" bucket={bucket({ actualAmount: '2500.00', status: 'CURRENT' })} />);
    expect(Number(container.querySelector('rect')!.getAttribute('y'))).toBe(26);
    rerender(<BucketGauge name="Rent" bucket={bucket({ actualAmount: '9000.00', over: true })} />);
    expect(Number(container.querySelector('rect')!.getAttribute('y'))).toBe(8);
  });
});
