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
	{
		id: 'logout',
		label: i18n.baseText('auth.signout'),
		icon: 'door-open',
		available: true,
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

		<!-- Vibrant Floating Plan Card (Matching user design Image 3) -->
		<div :class="[$style.planCardContainer, isCollapsed && $style.planCardCollapsed]">
			<div v-if="!isCollapsed" :class="$style.planCard">
				<div :class="$style.planCardHeader">
					<div :class="$style.planBadgeIcon">
						<N8nIcon icon="zap" size="small" />
					</div>
					<div :class="$style.planInfo">
						<span :class="$style.planTitle">Current plan</span>
						<span :class="$style.planSubtitle">{{ cloudPlanStore.currentPlanData?.displayName || 'Pro Plan' }}</span>
					</div>
				</div>
				<p :class="$style.planDescription">
					Supercharge your automation pipelines with unlimited execution.
				</p>
				<button
					type="button"
					:class="$style.upgradePillButton"
					@click="pageRedirectionHelper.goToUpgrade('sidebar')"
				>
					<span>Upgrade $50</span>
					<N8nIcon icon="arrow-right" size="mini" />
				</button>
			</div>
			<!-- Collapsed mini glowing lightning badge -->
			<button
				v-else
				type="button"
				:class="$style.collapsedPlanBadge"
				title="Current Plan: Pro (Click to upgrade)"
				@click="pageRedirectionHelper.goToUpgrade('sidebar')"
			>
				<N8nIcon icon="zap" size="small" />
			</button>
		</div>

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
	background-color: light-dark(#ffffff, #10121a);
	border: 1px solid light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.08));
	box-shadow:
		0 10px 30px -5px light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.45)),
		0 0 0 1px light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.04));
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
	border-bottom: 1px solid light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.06));
}

.scrollAreaWrapperWithTopBorder {
	border-top: 1px solid light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.06));
}

/* Plan Card Styles (Image 3) */
.planCardContainer {
	padding: 10px 12px 6px;
	box-sizing: border-box;
	width: 100%;

	&.planCardCollapsed {
		padding: 8px 4px 6px;
		display: flex;
		justify-content: center;
	}
}

.planCard {
	position: relative;
	background: linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%);
	border-radius: 16px;
	padding: 14px 14px 12px;
	color: #ffffff;
	box-shadow: 0 8px 24px -4px rgba(79, 70, 229, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3);
	display: flex;
	flex-direction: column;
	gap: 8px;
	overflow: hidden;

	&::after {
		content: '';
		position: absolute;
		top: -20px;
		right: -20px;
		width: 80px;
		height: 80px;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, transparent 70%);
		border-radius: 50%;
		pointer-events: none;
	}
}

.planCardHeader {
	display: flex;
	align-items: center;
	gap: 10px;
}

.planBadgeIcon {
	width: 30px;
	height: 30px;
	border-radius: 8px;
	background: rgba(255, 255, 255, 0.2);
	backdrop-filter: blur(8px);
	display: flex;
	align-items: center;
	justify-content: center;
	color: #ffffff;
	flex-shrink: 0;
}

.planInfo {
	display: flex;
	flex-direction: column;
	line-height: 1.2;
}

.planTitle {
	font-size: 11px;
	color: rgba(255, 255, 255, 0.8);
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0.04em;
}

.planSubtitle {
	font-size: 13.5px;
	font-weight: 700;
	color: #ffffff;
	margin-top: 1px;
}

.planDescription {
	font-size: 11px;
	line-height: 1.4;
	color: rgba(255, 255, 255, 0.85);
	margin: 0;
}

.upgradePillButton {
	margin-top: 4px;
	background: #ffffff;
	color: #4338ca;
	border: none;
	border-radius: 20px;
	padding: 6px 14px;
	font-size: 11.5px;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	cursor: pointer;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

	&:hover {
		background: #f8fafc;
		transform: translateY(-1px);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
	}

	&:active {
		transform: translateY(0);
	}
}

.collapsedPlanBadge {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
	border: none;
	color: #ffffff;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
	transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

	&:hover {
		transform: scale(1.1);
		box-shadow: 0 6px 20px rgba(79, 70, 229, 0.6);
	}
}
</style>
