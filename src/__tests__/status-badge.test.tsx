import { render, screen } from '@testing-library/react-native';

import { StatusBadge } from '@/components/status-badge';

describe('StatusBadge', () => {
  it.each([
    ['draft', 'مسوّدة'],
    ['under_review', 'قيد المراجعة'],
    ['approved', 'معتمد'],
  ] as const)('labels %s records (approved is shown in the review build too)', async (status, label) => {
    await render(<StatusBadge status={status} testID="b" />);
    expect(screen.getByTestId('b')).toHaveTextContent(label);
  });
});
