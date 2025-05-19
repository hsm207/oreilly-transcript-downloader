/**
 * @file Tests for the TocToggler domain service.
 */

import { TocToggler } from './TocToggler';
import { describe, it, beforeEach, expect, vi } from 'vitest';

// Minimal button HTML for both states
const hiddenButton = `
<button aria-describedby="table-of-contents-tooltip" aria-expanded="false" class="_widgetBtn_rllwa_12 _sidebarSpacing_rllwa_90 _darkMode_rllwa_61" data-testid="table-of-contents-button" aria-label="Table of contents" colormode="black">
  <span class="orm-Icon-root" style="height:1.5rem" data-testid="icon">
    <span style="font-size:1.5rem;width:1.5rem;height:1.5rem" class="orm-Icon-icon _icon_rllwa_1  orm-icon-bullet-list " aria-hidden="true"></span>
    <span class="orm-Icon-title">table of contents</span>
  </span>
</button>
`;

const visibleButton = `
<button aria-describedby="table-of-contents-tooltip" aria-expanded="true" class="_widgetBtn_rllwa_12 _sidebarSpacing_rllwa_90 _darkMode_rllwa_61 _buttonActive_rllwa_28" data-testid="table-of-contents-button" aria-label="Table of contents" colormode="black">
  <span class="orm-Icon-root" style="height:1.5rem" data-testid="icon">
    <span style="font-size:1.5rem;width:1.5rem;height:1.5rem" class="orm-Icon-icon _icon_rllwa_1  orm-icon-bullet-list " aria-hidden="true"></span>
    <span class="orm-Icon-title">table of contents</span>
  </span>
</button>
`;

describe('TocToggler', () => {
  let toggler: TocToggler;

  beforeEach(() => {
    toggler = new TocToggler();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('does nothing if the TOC button is not present', () => {
    // Should not throw or do anything
    expect(() => toggler.ensureTocVisible()).not.toThrow();
  });

  it('does nothing if the TOC is already visible', () => {
    document.body.innerHTML = visibleButton;
    const clickSpy = vi.spyOn(HTMLButtonElement.prototype, 'click');
    toggler.ensureTocVisible();
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('clicks the button if the TOC is hidden', () => {
    document.body.innerHTML = hiddenButton;
    const clickSpy = vi.spyOn(HTMLButtonElement.prototype, 'click');
    toggler.ensureTocVisible();
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
