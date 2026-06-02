import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { FolderTabs, type FolderTabItem } from '../src/components/folder-tabs';

const Icon = defineComponent({
  name: 'TestIcon',
  render: () => h('svg', { viewBox: '0 0 24 24' }, [h('path', { d: 'M4 12h16' })]),
});

const tabs: FolderTabItem[] = [
  { key: 'photos', label: 'Object photos', shortLabel: 'Photos', icon: Icon, count: 1, totalCount: 15 },
  { key: 'plans', label: 'Floor plans', shortLabel: 'Plans', icon: Icon, count: 2 },
  { key: 'maps', label: 'Maps', shortLabel: 'Maps', icon: Icon, disabled: true },
  { key: 'docs', label: 'Documents', shortLabel: 'Docs', icon: Icon, count: 12 },
];

describe('FolderTabs', () => {
  it('renders accessible tablist semantics and compact active labels', () => {
    const wrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
      },
    });

    expect(wrapper.attributes('role')).toBe('tablist');
    expect(wrapper.attributes('aria-label')).toBe('Media folders');
    expect(wrapper.find('[role="tab"]').attributes('aria-label')).toBe('Object photos, 1/15');
    expect(wrapper.find('.folder-tabs__label').text()).toBe('Photos');
  });

  it('emits v-model updates when automatic keyboard activation is enabled', async () => {
    const wrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
      },
    });

    await wrapper.find('[role="tab"]').trigger('keydown', { key: 'ArrowRight' });

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['plans']);
    expect(wrapper.emitted('activate')?.[0]?.[0]).toBe('plans');
  });

  it('keeps manual activation to focus movement only', async () => {
    const wrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        activation: 'manual',
      },
      attachTo: document.body,
    });

    await wrapper.find('[role="tab"]').trigger('keydown', { key: 'ArrowRight' });

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Floor plans, 2');
    wrapper.unmount();
  });
});

