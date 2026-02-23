/**
 * ErrorBoundary Component Tests
 * TDD: Tests for global error boundary that catches unhandled JS errors
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { ErrorBoundary } from '../ErrorBoundary';

// Suppress console.error during tests to avoid noise from intentional errors
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

// Component that throws an error for testing
const ThrowingComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error: component crashed');
  }
  return <Text>Normal content</Text>;
};

describe('ErrorBoundary', () => {
  it('renders children normally when no error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Hello World</Text>
      </ErrorBoundary>
    );

    expect(getByText('Hello World')).toBeTruthy();
  });

  it('shows fallback UI when child component throws an error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText(/The app encountered an unexpected error/)).toBeTruthy();
  });

  it('shows Restart button in fallback', () => {
    const { getByTestId } = render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(getByTestId('error-boundary-restart')).toBeTruthy();
  });

  it('resets error state when Restart button is pressed', () => {
    // We need to test that pressing restart resets the error boundary
    // After reset, if the child no longer throws, it should render normally
    let shouldThrow = true;

    const ConditionalThrower: React.FC = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <Text>Recovered content</Text>;
    };

    const { getByTestId, getByText, queryByText } = render(
      <ErrorBoundary>
        <ConditionalThrower />
      </ErrorBoundary>
    );

    // Should show error state
    expect(getByText('Something went wrong')).toBeTruthy();

    // Fix the error condition
    shouldThrow = false;

    // Press restart
    fireEvent.press(getByTestId('error-boundary-restart'));

    // Should now show recovered content
    expect(getByText('Recovered content')).toBeTruthy();
    expect(queryByText('Something went wrong')).toBeNull();
  });

  it('renders with custom testID', () => {
    const { getByTestId } = render(
      <ErrorBoundary testID="custom-boundary">
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(getByTestId('custom-boundary')).toBeTruthy();
  });

  it('renders custom fallback when provided', () => {
    const CustomFallback = <View><Text>Custom error page</Text></View>;

    const { getByText, queryByText } = render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(getByText('Custom error page')).toBeTruthy();
    expect(queryByText('Something went wrong')).toBeNull();
  });

  it('shows stack trace in development mode', () => {
    // __DEV__ is true in test environment by default
    const { getByTestId } = render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(getByTestId('error-boundary-stack')).toBeTruthy();
  });

  it('has accessibility label on Restart button', () => {
    const { getByTestId } = render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    const restartBtn = getByTestId('error-boundary-restart');
    expect(restartBtn.props.accessibilityLabel).toBe('Restart the app');
    expect(restartBtn.props.accessibilityRole).toBe('button');
  });
});
