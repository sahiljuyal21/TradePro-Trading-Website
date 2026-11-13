import React from 'react';
import { createRoot } from 'react-dom/client';
import { act, Simulate } from 'react-dom/test-utils';
import { Header } from './Layout';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('Header profile menu', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root.render(<Header user={{ name: 'Demo Trader', email: 'demo@example.test' }} />);
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function toggleProfileMenu() {
    act(() => Simulate.click(container.querySelector('.user-btn')));
  }

  function isMenuHidden() {
    return container.querySelector('.user-dropdown').hidden;
  }

  test('starts closed and toggles from the profile button', () => {
    expect(isMenuHidden()).toBe(true);
    expect(container.querySelector('.user-btn').getAttribute('aria-expanded')).toBe('false');

    toggleProfileMenu();
    expect(isMenuHidden()).toBe(false);
    expect(container.querySelector('.user-btn').getAttribute('aria-expanded')).toBe('true');

    toggleProfileMenu();
    expect(isMenuHidden()).toBe(true);
  });

  test('closes on outside click and Escape', () => {
    toggleProfileMenu();
    act(() => document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
    expect(isMenuHidden()).toBe(true);

    toggleProfileMenu();
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    expect(isMenuHidden()).toBe(true);
  });
});