import { render, screen, fireEvent, act } from '@testing-library/react';
import { SidebarProvider, useSidebar } from '@/hooks/useSidebar';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

function TestConsumer() {
  const { isOpen, setIsOpen, collapsed, setCollapsed } = useSidebar();
  return (
    <div>
      <span data-testid="isOpen">{String(isOpen)}</span>
      <span data-testid="collapsed">{String(collapsed)}</span>
      <button data-testid="toggleOpen" onClick={() => setIsOpen(!isOpen)}>Toggle Open</button>
      <button data-testid="toggleCollapsed" onClick={() => setCollapsed(!collapsed)}>Toggle Collapsed</button>
    </div>
  );
}

describe('useSidebar', () => {
  it('provides default values', () => {
    render(
      <SidebarProvider>
        <TestConsumer />
      </SidebarProvider>
    );
    expect(screen.getByTestId('isOpen').textContent).toBe('false');
    expect(screen.getByTestId('collapsed').textContent).toBe('false');
  });

  it('toggles isOpen state', () => {
    render(
      <SidebarProvider>
        <TestConsumer />
      </SidebarProvider>
    );
    fireEvent.click(screen.getByTestId('toggleOpen'));
    expect(screen.getByTestId('isOpen').textContent).toBe('true');
    fireEvent.click(screen.getByTestId('toggleOpen'));
    expect(screen.getByTestId('isOpen').textContent).toBe('false');
  });

  it('toggles collapsed state', () => {
    render(
      <SidebarProvider>
        <TestConsumer />
      </SidebarProvider>
    );
    fireEvent.click(screen.getByTestId('toggleCollapsed'));
    expect(screen.getByTestId('collapsed').textContent).toBe('true');
  });

  it('throws when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useSidebar must be used within a SidebarProvider');
    consoleSpy.mockRestore();
  });
});
