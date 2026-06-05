import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import {
  Folder,
  FolderAttachment,
  FolderBinder,
  FolderTabPanelStack,
  FolderTabs,
  type FolderTabItem,
  type FolderTabKey,
} from '../src/components/folder-tabs';

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

async function waitForMotionFrame(): Promise<void> {
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
  await nextTick();
}

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

  it('supports stacked vertical folder appearance without changing tab semantics', () => {
    const wrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        appearance: 'stack',
      },
    });

    expect(wrapper.classes()).toContain('folder-tabs--appearance-stack');
    expect(wrapper.find('[role="tab"]').attributes('aria-selected')).toBe('true');
    expect(wrapper.find('[role="tab"]').attributes('aria-label')).toBe('Object photos, 1/15');
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

  it('marks the selected tab as grabbed while the previous tab recedes', async () => {
    const wrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');
    await renderedTabs[1].trigger('click');

    expect(renderedTabs[1].classes()).toContain('is-grabbing');
    expect(renderedTabs[0].classes()).toContain('is-receding');
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

  it('renders configurable stacked content panels in the requested direction', () => {
    const wrapper = mount(FolderTabPanelStack, {
      props: {
        orientation: 'vertical',
        edge: 'right',
        depth: 'deep',
        layers: 5,
        activeIndex: 3,
      },
      slots: {
        default: 'Panel content',
      },
    });

    expect(wrapper.classes()).toContain('folder-tab-panel-stack--edge-right');
    expect(wrapper.classes()).toContain('folder-tab-panel-stack--depth-deep');
    expect(wrapper.classes()).toContain('folder-tab-panel-stack--layers-2');
    expect(wrapper.attributes('style')).toContain('--folder-tab-panel-active-index: 3');
    expect(wrapper.text()).toBe('Panel content');
  });

  it('renders tintable folders inside a directional binder pull state', () => {
    const wrapper = mount({
      render: () => h(FolderBinder, {
        orientation: 'vertical',
        edge: 'left',
        depth: 'deep',
        layers: 2,
        pulled: true,
        tone: 'teal',
      }, {
        default: () => h(Folder, { tone: 'teal' }, () => 'Folder content'),
      }),
    });

    const binder = wrapper.find('.folder-binder');
    expect(binder.classes()).toContain('folder-binder--edge-left');
    expect(binder.classes()).toContain('folder-binder--tone-teal');
    expect(binder.classes()).toContain('is-pulled');
    expect(wrapper.find('.folder').classes()).toContain('folder--tone-teal');
    expect(wrapper.text()).toBe('Folder content');
  });

  it('keeps the tab grab and folder pull attached through one activation', async () => {
    const Harness = defineComponent({
      setup() {
        const active = ref('photos');

        return () => h(FolderAttachment, {
          tabs,
          modelValue: active.value,
          ariaLabel: 'Media folders',
          orientation: 'vertical',
          edge: 'left',
          appearance: 'stack',
          tone: 'teal',
          pullDuration: 480,
          'onUpdate:modelValue': (key: FolderTabKey) => {
            active.value = String(key);
          },
        }, {
          default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
        });
      },
    });

    const wrapper = mount(Harness);
    const renderedTabs = wrapper.findAll('[role="tab"]');
    await renderedTabs[1].trigger('click');
    await nextTick();
    await waitForMotionFrame();

    const attachment = wrapper.findComponent(FolderAttachment);

    expect(attachment.emitted('update:modelValue')?.[0]).toEqual(['plans']);
    expect(attachment.emitted('activate')?.[0]?.[0]).toBe('plans');
    expect(wrapper.find('.folder .folder-attachment__tab').exists()).toBe(true);
    expect(wrapper.find('.folder-attachment__folder.is-active .folder-attachment__tab').exists()).toBe(true);
    expect(wrapper.find('.folder-attachment__folder.is-active .folder-attachment__content').text()).toBe('Floor plans');
    expect(renderedTabs[1].classes()).toContain('is-pulling');
    expect(renderedTabs[1].classes()).toContain('is-pulled');
    expect(wrapper.find('.folder-binder').classes()).toContain('is-pulled');
    expect(wrapper.find('.folder-binder').classes()).toContain('folder-binder--edge-left');
    expect(wrapper.find('.folder').classes()).toContain('folder--tone-teal');
  });

  it('starts tucked until a folder is explicitly pulled', () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'left',
        appearance: 'stack',
        tone: 'teal',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    expect(wrapper.find('.folder-binder').classes()).not.toContain('is-pulled');
    expect(wrapper.find('[role="tab"]').classes()).not.toContain('is-open');
    expect(wrapper.find('.folder-attachment__folder.is-active .folder-attachment__content').text()).toBe('Object photos');
  });

  it('uses a tab item tone for its attached folder before the fallback tone', async () => {
    const tintedTabs: FolderTabItem[] = tabs.map((tab) => (
      tab.key === 'plans' ? { ...tab, tone: 'copper' } : tab
    ));

    const wrapper = mount(FolderAttachment, {
      props: {
        tabs: tintedTabs,
        modelValue: 'plans',
        ariaLabel: 'Media folders',
        tone: 'teal',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await nextTick();

    expect(wrapper.find('.folder-attachment__folder.is-active').classes()).toContain('folder--tone-copper');
    expect(wrapper.find('.folder-binder').classes()).toContain('folder-binder--tone-teal');
  });

  it('slides a hovered attached tab folder toward its edge and displaces neighbors', async () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'left',
        appearance: 'stack',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');
    await renderedTabs[1].trigger('pointerenter');
    await nextTick();

    const activeFolder = wrapper.findAll('.folder-attachment__folder')[0];
    const hoveredFolder = wrapper.findAll('.folder-attachment__folder')[1];
    const displacedFolder = wrapper.findAll('.folder-attachment__folder')[2];
    expect(hoveredFolder.classes()).toContain('is-hovered');
    expect(renderedTabs[1].classes()).toContain('is-hovered');
    expect(activeFolder.attributes('style')).toContain('--folder-piece-z: 250');
    expect(hoveredFolder.attributes('style')).toContain('--folder-piece-z: 180');
    expect(hoveredFolder.attributes('style')).toContain('--folder-piece-rest-x: 9.00px');
    expect(hoveredFolder.attributes('style')).toContain('--folder-piece-hover-x: 0.00px');
    expect(hoveredFolder.attributes('style')).toContain('--folder-piece-hover-y: 0.00px');
    expect(displacedFolder.attributes('style')).toContain('--folder-piece-slot: 190.00px');
  });

  it('can emulate hover with BEM classes for visual QA', async () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'horizontal',
        edge: 'top',
        appearance: 'stack',
        emulatedHoverKey: 'plans',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await nextTick();

    const emulatedFolder = wrapper.findAll('.folder-attachment__folder')[1];
    const emulatedTab = wrapper.findAll('[role="tab"]')[1];

    expect(wrapper.find('.folder-attachment').classes()).toContain('folder-attachment--hover-emulated');
    expect(emulatedFolder.classes()).toContain('folder-attachment__folder--hover-emulated');
    expect(emulatedFolder.classes()).toContain('is-hovered');
    expect(emulatedTab.classes()).toContain('folder-attachment__tab--hover-emulated');
    expect(emulatedTab.classes()).toContain('is-hovered');
    expect(wrapper.findAll('.folder-attachment__folder')[0].attributes('style'))
      .toContain('--folder-piece-z: 250');
    expect(emulatedFolder.attributes('style')).toContain('--folder-piece-z: 180');
    expect(wrapper.findAll('.folder-attachment__folder')[2].attributes('style'))
      .toContain('--folder-piece-slot: 190.00px');
  });

  it('keeps active folders out of hover expansion and lets real hover own the QA hook', async () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'right',
        appearance: 'stack',
        emulatedHoverKey: 'plans',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await nextTick();

    const renderedTabs = wrapper.findAll('[role="tab"]');
    const folders = wrapper.findAll('.folder-attachment__folder');

    expect(folders[0].classes()).toContain('is-active');
    expect(folders[0].classes()).not.toContain('is-hovered');
    expect(renderedTabs[0].classes()).not.toContain('is-hovered');
    expect(folders[1].classes()).toContain('folder-attachment__folder--hover-emulated');

    await renderedTabs[3].trigger('pointerenter');
    await nextTick();

    expect(folders[1].classes()).not.toContain('is-hovered');
    expect(folders[1].classes()).not.toContain('folder-attachment__folder--hover-emulated');
    expect(folders[3].classes()).toContain('is-hovered');
    expect(renderedTabs[3].classes()).toContain('is-hovered');
  });

  it('does not hover-expand the selected bottom or right edge folder', async () => {
    const bottom = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'horizontal',
        edge: 'bottom',
        appearance: 'stack',
        emulatedHoverKey: 'photos',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const right = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'right',
        appearance: 'stack',
        emulatedHoverKey: 'photos',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await nextTick();

    const bottomActive = bottom.findAll('.folder-attachment__folder')[0];
    const rightActive = right.findAll('.folder-attachment__folder')[0];

    expect(bottomActive.classes()).toContain('is-active');
    expect(bottomActive.classes()).not.toContain('is-hovered');
    expect(bottom.findAll('[role="tab"]')[0].classes()).not.toContain('is-hovered');

    expect(rightActive.classes()).toContain('is-active');
    expect(rightActive.classes()).not.toContain('is-hovered');
    expect(right.findAll('[role="tab"]')[0].classes()).not.toContain('is-hovered');
  });

  it('moves bottom and right inactive hover states toward their folder edges', async () => {
    const bottom = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'horizontal',
        edge: 'bottom',
        appearance: 'stack',
        emulatedHoverKey: 'plans',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const right = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'right',
        appearance: 'stack',
        emulatedHoverKey: 'plans',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await nextTick();

    const bottomActive = bottom.findAll('.folder-attachment__folder')[0];
    const bottomHovered = bottom.findAll('.folder-attachment__folder')[1];
    const rightActive = right.findAll('.folder-attachment__folder')[0];
    const rightHovered = right.findAll('.folder-attachment__folder')[1];

    expect(bottomActive.attributes('style')).toContain('--folder-piece-z: 250');
    expect(bottomHovered.attributes('style')).toContain('--folder-piece-z: 180');
    expect(bottomHovered.attributes('style')).toContain('--folder-piece-rest-y: -9.00px');
    expect(bottomHovered.attributes('style')).toContain('--folder-piece-hover-y: 0.00px');

    expect(rightActive.attributes('style')).toContain('--folder-piece-z: 250');
    expect(rightHovered.attributes('style')).toContain('--folder-piece-z: 180');
    expect(rightHovered.attributes('style')).toContain('--folder-piece-rest-x: -9.00px');
    expect(rightHovered.attributes('style')).toContain('--folder-piece-hover-x: 0.00px');
  });

  it('returns the pulled folder before selecting the next one', async () => {
    const Harness = defineComponent({
      setup() {
        const active = ref('photos');

        return () => h(FolderAttachment, {
          tabs,
          modelValue: active.value,
          ariaLabel: 'Media folders',
          orientation: 'vertical',
          edge: 'left',
          appearance: 'stack',
          tone: 'teal',
          returnDuration: 20,
          'onUpdate:modelValue': (key: FolderTabKey) => {
            active.value = String(key);
          },
        }, {
          default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
        });
      },
    });

    const wrapper = mount(Harness);
    const renderedTabs = wrapper.findAll('[role="tab"]');

    await renderedTabs[1].trigger('click');
    await nextTick();
    await waitForMotionFrame();

    expect(wrapper.find('.folder-binder').classes()).toContain('is-pulled');
    expect(wrapper.find('.folder-attachment__content').text()).toBe('Floor plans');

    await renderedTabs[0].trigger('click');
    await nextTick();

    expect(wrapper.find('.folder-binder').classes()).not.toContain('is-pulled');
    expect(wrapper.find('.folder-attachment__content').text()).toBe('Floor plans');
    expect(wrapper.findAll('.folder-attachment__folder')[0].classes()).toContain('is-selecting');
    expect(wrapper.findAll('.folder-attachment__folder')[0].attributes('style')).toContain('--folder-piece-z: 280');

    await new Promise((resolve) => window.setTimeout(resolve, 25));
    await nextTick();
    await waitForMotionFrame();

    expect(wrapper.find('.folder-binder').classes()).toContain('is-pulled');
    expect(wrapper.find('.folder-attachment__content').text()).toBe('Object photos');
  });
});
