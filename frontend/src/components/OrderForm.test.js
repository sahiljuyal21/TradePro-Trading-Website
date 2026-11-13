import React from 'react';
import { createRoot } from 'react-dom/client';
import { act, Simulate } from 'react-dom/test-utils';
import { OrderForm } from './OrderForm';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('OrderForm', () => {
  let container;
  let root;
  let onSubmit;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    onSubmit = jest.fn();
    act(() => {
      root.render(
        <OrderForm
          stock={{ symbol: 'AAPL', price: 100 }}
          onSubmit={onSubmit}
          userBalance={1000}
          holdings={[{ symbol: 'AAPL', quantity: 1 }]}
        />
      );
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function change(input, value) {
    act(() => Simulate.change(input, { target: { value } }));
  }

  function clickButton(label) {
    const button = [...container.querySelectorAll('button')]
      .find(candidate => candidate.textContent.trim() === label);
    act(() => Simulate.click(button));
  }

  function submitForm() {
    act(() => Simulate.submit(container.querySelector('form')));
  }

  test('rejects a zero quantity', () => {
    change(container.querySelector('input[type="number"]'), '0');
    submitForm();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Quantity is required');
  });

  test('submits a valid market buy', () => {
    change(container.querySelector('input[type="number"]'), '2');
    submitForm();

    expect(onSubmit).toHaveBeenCalledWith({
      symbol: 'AAPL',
      type: 'market',
      side: 'buy',
      quantity: 2,
      price: undefined
    });
  });

  test('requires a limit price before submitting a limit order', () => {
    clickButton('Limit');
    change(container.querySelector('input[type="number"]'), '2');
    submitForm();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Limit price is required');

    change(container.querySelectorAll('input[type="number"]')[1], '95.5');
    submitForm();

    expect(onSubmit).toHaveBeenCalledWith({
      symbol: 'AAPL',
      type: 'limit',
      side: 'buy',
      quantity: 2,
      price: 95.5
    });
  });

  test('rejects selling more shares than the user owns', () => {
    clickButton('Sell');
    change(container.querySelector('input[type="number"]'), '2');
    submitForm();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Max: 1 shares owned');
  });
});