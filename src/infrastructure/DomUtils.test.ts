import { describe, it, expect } from 'vitest';
import { waitForElement } from './DomUtils';

/**
 * @file DomUtils.test.ts
 * @description Tests for DomUtils infrastructure utilities.
 */

describe('waitForElement', () => {
  it('resolves with the element if it appears in time', async () => {
    const div = document.createElement('div');
    setTimeout(() => {
      div.className = 'test-el';
      document.body.appendChild(div);
    }, 100);
    const el = await waitForElement('.test-el', 500);
    expect(el).not.toBeNull();
    expect(el).toBe(div);
    document.body.removeChild(div);
  });

  it('resolves with null if the element does not appear', async () => {
    const el = await waitForElement('.does-not-exist', 200);
    expect(el).toBeNull();
  });
});
