import { render, screen, fireEvent } from '@testing-library/react';
import { Toggle } from '@/components/common/Toggle';
import { Segmented } from '@/components/common/Segmented';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { SettingRow } from '@/components/common/SettingRow';

describe('Toggle', () => {
  it('renders an accessible switch reflecting checked state', () => {
    render(<Toggle checked label="Enable" onChange={() => {}} />);
    const sw = screen.getByRole('switch', { name: 'Enable' });
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with the toggled value on click', () => {
    const onChange = jest.fn();
    render(<Toggle checked={false} label="Enable" onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not fire onChange when disabled', () => {
    const onChange = jest.fn();
    render(<Toggle checked={false} label="Enable" disabled onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Segmented', () => {
  const options = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
  ];

  it('marks the active option as selected', () => {
    render(<Segmented options={options} value="b" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onChange with the option value', () => {
    const onChange = jest.fn();
    render(<Segmented options={options} value="a" onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Beta' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});

describe('EmptyState', () => {
  it('renders title, hint and action', () => {
    render(<EmptyState title="Nothing here" hint="Add your first item" action={<button>Add</button>} />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Add your first item')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });
});

describe('PageHeader', () => {
  it('renders the title, subtitle and actions', () => {
    render(<PageHeader title="Items" subtitle="Manage catalog" actions={<button>Add Item</button>} />);
    expect(screen.getByRole('heading', { name: 'Items' })).toBeInTheDocument();
    expect(screen.getByText('Manage catalog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
  });
});

describe('SettingRow', () => {
  it('renders label, description and control', () => {
    render(<SettingRow label="Sound" description="Play a sound" control={<span data-testid="ctl" />} />);
    expect(screen.getByText('Sound')).toBeInTheDocument();
    expect(screen.getByText('Play a sound')).toBeInTheDocument();
    expect(screen.getByTestId('ctl')).toBeInTheDocument();
  });

  it('is a button that fires onClick when provided', () => {
    const onClick = jest.fn();
    render(<SettingRow label="Open" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: /open/i }));
    expect(onClick).toHaveBeenCalled();
  });
});
