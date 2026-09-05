<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '@n8n/i18n';
import { N8nScrollArea, N8nIcon, type IMenuItem } from '@n8n/design-system';
import { ABOUT_MODAL_KEY, VIEWS, WHATS_NEW_MODAL_KEY } from '@/app/constants';
import { hasPermission } from '@/app/utils/rbac/permissions';
import { useRootStore } from '@n8n/stores/useRootStore';
import { useCloudPlanStore } from '@n8n/stores/cloudPlan.store';
import { useSettingsStore } from '@n8n/stores/settings.store';
import { useTemplatesStore } from '@/features/workflows/templates/templates.store';
import { useUIStore } from '@/app/stores/ui.store';
import { useVersionsStore } from '@n8n/stores/versions.store';
import { useTelemetry } from '@n8n/composables/useTelemetry';
import { usePageRedirectionHelper } from '@/app/composables/usePageRedirectionHelper';
import { useKeybindings } from '@/app/composables/useKeybindings';
import {
	MAX_SIDEBAR_WIDTH,
	MIN_SIDEBAR_WIDTH,
	useSidebarLayout,
} from '@/app/composables/useSidebarLayout';
import { useSettingsItems } from '@/app/composables/useSettingsItems';
import { useAiGateway } from '@/app/composables/useAiGateway';
import MainSidebarHeader from '@/app/components/MainSidebarHeader.vue';
import BottomMenu from '@/app/components/BottomMenu.vue';
import MainSidebarUserArea from '@/app/components/MainSidebarUserArea.vue';
import MainSidebarSourceControl from '@/app/components/MainSidebarSourceControl.vue';
import ProjectNavigation from '@/features/collaboration/projects/components/ProjectNavigation.vue';
import { useResourceCenterStore } from '@/experiments/resourceCenter/stores/resourceCenter.store';
import { LOCAL_STORAGE_SIDEBAR_WIDTH } from '@/app/constants';
import { useSidebarExpandedExperiment } from '@/experiments/sidebarExpanded';
import { trackTemplatesClick, TemplateClickSource } from '@/experiments/utils';
import { injectWorkflowDocumentStore } from '../stores/workflowDocument.store';

const cloudPlanStore = useCloudPlanStore();
const rootStore = useRootStore();
const settingsStore = useSettingsStore();
const templatesStore = useTemplatesStore();
const uiStore = useUIStore();
const versionsStore = useVersionsStore();
const workflowDocumentStore = injectWorkflowDocumentStore();
const resourceCenterStore = useResourceCenterStore();

const i18n = useI18n();
const router = useRouter();
const telemetry = useTelemetry();
const pageRedirectionHelper = usePageRedirectionHelper();

const { applyExperiment: applySidebarExpandedExperiment } = useSidebarExpandedExperiment();
applySidebarExpandedExperiment();

// RC-1: auto-expand sidebar once if not already expanded
if (resourceCenterStore.shouldAutoExpandSidebar) {
	if (uiStore.sidebarMenuCollapsed) {
		uiStore.sidebarMenuCollapsed = false;
		localStorage.setItem(LOCAL_STORAGE_SIDEBAR_WIDTH, '200');
	}
	resourceCenterStore.markSidebarAutoExpanded();
}

const {
	isCollapsed,
	isResizing,
	sidebarWidth,
	onResizeStart,
	onResize,
	onResizeEnd,
	toggleCollapse,
} = useSidebarLayout();

const { settingsItems, handleSettingsItemSelect } = useSettingsItems();
const { fetchWallet, isEnabled: isAiGatewayEnabled } = useAiGateway();

// Component data
const basePath = ref('');
const scrollAreaRef = ref<InstanceType<typeof N8nScrollArea>>();
const hasOverflow = ref(false);
const hasScrolledFromTop = ref(false);
let resizeObserver: ResizeObserver | null = null;

const showWhatsNewNotification = computed(
	() =>
		versionsStore.hasVersionUpdates ||
		versionsStore.whatsNewArticles.some(
			(article) => !versionsStore.isWhatsNewArticleRead(article.id),
		),
);

const isResourceCenterEnabled = computed(() => resourceCenterStore.isFeatureEnabled());

const mainMenuItems = computed<IMenuItem[]>(() => [
	{
		id: 'cloud-admin',
		position: 'bottom',
		label: 'Admin Panel',
		icon: 'cloud',
		available: settingsStore.isCloudDeployment && hasPermission(['instanceOwner']),
	},
	{
		// Resource Center - replaces Templates when experiment is enabled
		id: 'resource-center',
		icon: { type: 'icon', value: 'lightbulb', color: 'primary' },
		label: i18n.baseText('experiments.resourceCenter.sidebar'),
		position: 'bottom',
		available: isResourceCenterEnabled.value,
		route: { to: { name: VIEWS.RESOURCE_CENTER } },
	},
	{
		// Link to in-app templates, available if custom templates are enabled and resource center is disabled
		id: 'templates',
		icon: 'package-open',
		label: i18n.baseText('generic.templates'),
		position: 'bottom',
		available:
			settingsStore.isTemplatesEnabled &&
			templatesStore.hasCustomTemplatesHost &&
			!isResourceCenterEnabled.value,
		route: { to: { name: VIEWS.TEMPLATES } },
	},
	{
		// Link to website templates, available if custom templates host is not configured and resource center is disabled
		id: 'templates',
		icon: 'package-open',
		label: i18n.baseText('generic.templates'),
		position: 'bottom',
		available:
			settingsStore.isTemplatesEnabled &&
			!templatesStore.hasCustomTemplatesHost &&
			!isResourceCenterEnabled.value,
		link: {
			href: templatesStore.websiteTemplateRepositoryURL,
			target: '_blank',
		},
	},
	{
		id: 'insights',
		icon: 'chart-column-decreasing',
		label: 'Insights',
		position: 'bottom',
		route: { to: { name: VIEWS.INSIGHTS } },
		available:
			settingsStore.isModuleActive('insights') &&
			hasPermission(['rbac'], { rbac: { scope: 'insights:list' } }),
	},
	{
		id: 'about',
		icon: 'info',
		label: i18n.baseText('mainSidebar.aboutN8n'),
		position: 'bottom',
	},
	{
		id: 'settings',
		label: i18n.baseText('mainSidebar.settings'),
		icon: 'settings',
		available: true,
		children: settingsItems.value,
	},
]);


const visibleMenuItems = computed<IMenuItem[]>(() =>
	mainMenuItems.value
		.filter((item) => item.available !== false)
		.map((item) => ({
			...item,
			children: item.children?.filter((child) => child.available !== false),
		})),
);

const checkOverflow = () => {
	const position = scrollAreaRef.value?.getScrollPosition();
	if (position && scrollAreaRef.value?.$el) {
		const element = scrollAreaRef.value.$el as HTMLElement;
		const hasVerticalOverflow = position.height > element.clientHeight;
		hasOverflow.value = hasVerticalOverflow;
		// Check if scrolled from top - only show border if there's overflow AND scrolled
		hasScrolledFromTop.value = hasVerticalOverflow && position.top > 0;
	}
};

// Re-check overflow when sidebar collapse state changes
watch(isCollapsed, () => {
	void nextTick(() => {
		checkOverflow();
	});
});

onMounted(() => {
	basePath.value = rootStore.baseUrl;
	if (isAiGatewayEnabled.value) void fetchWallet();

	void nextTick(() => {
		checkOverflow();

		if (scrollAreaRef.value?.$el) {
			const element = scrollAreaRef.value.$el as HTMLElement;
			resizeObserver = new ResizeObserver(() => {
				checkOverflow();
			});
			resizeObserver.observe(element);
			checkOverflow();
		}
	});

	window.addEventListener('resize', checkOverflow);
});

onBeforeUnmount(() => {
	if (resizeObserver) {
		resizeObserver.disconnect();
		resizeObserver = null;
	}

	window.removeEventListener('resize', checkOverflow);
});

const trackHelpItemClick = (itemType: string) => {
	telemetry.track('User clicked help resource', {
		type: itemType,
		workflow_id: workflowDocumentStore.value.workflowId,
	});
};

function openCommandBar(event: MouseEvent) {
	event.stopPropagation();

	void nextTick(() => {
		const keyboardEvent = new KeyboardEvent('keydown', {
			key: 'k',
			code: 'KeyK',
			metaKey: true,
			bubbles: true,
			cancelable: true,
		});
		document.dispatchEvent(keyboardEvent);
	});
}

const handleSelect = (key: string) => {
	switch (key) {
		case 'about': {
			trackHelpItemClick('about');
			uiStore.openModal(ABOUT_MODAL_KEY);
			break;
		}
		case 'cloud-admin': {
			void pageRedirectionHelper.goToDashboard();
			break;
		}
		case 'settings-n8n-connect': {
			void handleSettingsItemSelect(key);
			break;
		}
		case 'templates':
			trackTemplatesClick(TemplateClickSource.sidebarButton);
			break;
		case 'insights':
			telemetry.track('User clicked insights link from side menu');
			break;
		case 'logout':
			onLogout();
			break;
		default:
			if (key.startsWith('whats-new-article-')) {
				const articleId = Number(key.replace('whats-new-article-', ''));

				telemetry.track("User clicked on what's new section", {
					article_id: articleId,
				});
				uiStore.openModalWithData({
					name: WHATS_NEW_MODAL_KEY,
					data: {
						articleId,
					},
				});
			}

			break;
	}
};

const onLogout = () => {
	void router.push({ name: VIEWS.SIGNOUT });
};

useKeybindings({
	ctrl_alt_o: () => handleSelect('about'),
	['bracketleft']: () => toggleCollapse(),
});
</script>

<template>
	<aside
		id="side-menu"
		:class="{
			[$style.sideMenu]: true,
			[$style.sideMenuCollapsed]: isCollapsed,
		}"
	>
		<MainSidebarHeader
			:is-collapsed="isCollapsed"
			@collapse="toggleCollapse"
			@open-command-bar="openCommandBar"
		/>
		<div
			:class="{
				[$style.scrollAreaWrapper]: true,
				[$style.scrollAreaWrapperWithBottomBorder]: hasOverflow && !isCollapsed,
				[$style.scrollAreaWrapperWithTopBorder]: hasScrolledFromTop && !isCollapsed,
			}"
		>
			<N8nScrollArea ref="scrollAreaRef" @scroll-capture="checkOverflow">
				<ProjectNavigation
					:collapsed="isCollapsed"
					:plan-name="cloudPlanStore.currentPlanData?.displayName"
				/>
			</N8nScrollArea>
		</div>
		<BottomMenu
			:items="visibleMenuItems"
			:is-collapsed="isCollapsed"
			@logout="onLogout"
			@select="handleSelect"
		/>

		<MainSidebarUserArea :is-collapsed="isCollapsed" />
		<MainSidebarSourceControl :is-collapsed="isCollapsed" />
	</aside>
</template>

<style lang="scss" module>
.sideMenu {
	position: relative;
	width: 240px;
	min-width: 240px;
	max-width: 240px;
	height: calc(100% - 16px);
	margin: 8px;
	border-radius: 24px;
	display: flex;
	flex-direction: column;
	background-color: #0b0c10;
	border: 1px solid rgba(255, 255, 255, 0.08);
	box-shadow:
		0 14px 38px -6px rgba(0, 0, 0, 0.7),
		0 0 0 1px rgba(255, 255, 255, 0.04);
	transition: width var(--duration--snappy) var(--easing--ease-out),
		min-width var(--duration--snappy) var(--easing--ease-out),
		max-width var(--duration--snappy) var(--easing--ease-out);
	will-change: width;
	overflow: hidden;
	box-sizing: border-box;

	&.sideMenuCollapsed {
		width: 58px;
		min-width: 58px;
		max-width: 58px;
		border-radius: 24px;
	}
}

.scrollAreaWrapper {
	position: relative;
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
	padding-top: var(--spacing--2xs);
}

.scrollAreaWrapperWithBottomBorder {
	border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.scrollAreaWrapperWithTopBorder {
	border-top: 1px solid rgba(255, 255, 255, 0.06);
}

/* 
 * Sleek Deep Black Glass Theme & Shader/Glow Effects for Sidebar items & Teleported Popovers
 */
:global(#side-menu),
:global([data-radix-popper-content-wrapper]),
:global(.el-popper) {
	/* Section headers / Labels */
	:global(.n8n-text) {
		color: #94a3b8;
	}

	/* Menu items base state */
	:global(a[role='menuitem']),
	:global(div[role='menuitem']) {
		color: #e2e8f0 !important;
		border: 1px solid transparent;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		background: transparent;

		:global(.n8n-text) {
			color: #e2e8f0 !important;
			font-weight: 500;
		}

		:global(svg) {
			color: #94a3b8 !important;
			transition: all 0.2s ease;
		}

		/* Hover state */
		&:hover:not(:global(.router-link-active)):not(:global(.active)) {
			background: rgba(255, 255, 255, 0.08) !important;
			border-color: rgba(255, 255, 255, 0.1) !important;

			:global(.n8n-text) {
				color: #fff !important;
			}

			:global(svg) {
				color: #fff !important;
				transform: scale(1.06);
			}
		}

		/* Active / Selected state (Deep glowing dark glass card with shader gradient) */
		&:global(.router-link-active),
		&:global(.active) {
			background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%) !important;
			border: 1px solid rgba(255, 255, 255, 0.18) !important;
			box-shadow:
				0 4px 20px -2px rgba(0, 0, 0, 0.5),
				inset 0 1px 1px 0 rgba(255, 255, 255, 0.25),
				0 0 16px -4px rgba(255, 255, 255, 0.1) !important;
			backdrop-filter: blur(16px);

			:global(.n8n-text) {
				color: #fff !important;
				font-weight: 600;
				text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
			}

			:global(svg) {
				color: #fff !important;
				filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.4));
			}
		}
	}
}
</style>



