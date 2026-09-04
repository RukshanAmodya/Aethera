<script lang="ts" setup>
import { onClickOutside, type VueInstance } from '@vueuse/core';
import { ref, type Ref } from 'vue';
import { I18nT } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import {
	N8nButton,
	N8nTooltip,
	N8nLink,
	N8nIcon,
	N8nIconButton,
	N8nNavigationDropdown,
} from '@n8n/design-system';
import { useI18n } from '@n8n/i18n';
import { VIEWS } from '@/app/constants';
import { useSourceControlStore } from '@/features/integrations/sourceControl.ee/sourceControl.store';
import KeyboardShortcutTooltip from '@/app/components/KeyboardShortcutTooltip.vue';
import { useSettingsStore } from '@n8n/stores/settings.store';
import { useGlobalEntityCreation } from '@/app/composables/useGlobalEntityCreation';

defineProps<{
	isCollapsed: boolean;
	hideCreate?: boolean;
}>();

const emit = defineEmits<{
	collapse: [];
	openCommandBar: [event: MouseEvent];
}>();

const i18n = useI18n();
const sourceControlStore = useSourceControlStore();
const settingsStore = useSettingsStore();

const createBtn = ref<InstanceType<typeof N8nNavigationDropdown>>();

onClickOutside(createBtn as Ref<VueInstance>, () => {
	createBtn.value?.close();
});

function toggleCollapse() {
	emit('collapse');
}

function openCommandBar(event: MouseEvent) {
	emit('openCommandBar', event);
}

const {
	menu,
	handleSelect: handleMenuSelect,
	createProjectAppendSlotName,
	createWorkflowsAppendSlotName,
	createCredentialsAppendSlotName,
	projectsLimitReachedMessage,
	upgradeLabel,
	hasPermissionToCreateProjects,
} = useGlobalEntityCreation();
</script>

<template>
	<div
		:class="{
			[$style.header]: true,
			[$style.collapsed]: isCollapsed,
		}"
	>
		<!-- Mac Window Traffic Light Dots (Expanded mode) -->
		<div v-if="!isCollapsed" :class="$style.macWindowDots">
			<span :class="[$style.macDot, $style.closeDot]" />
			<span :class="[$style.macDot, $style.minimizeDot]" />
			<span :class="[$style.macDot, $style.maximizeDot]" />
		</div>

		<!-- Brand Row: Logo + App Name + Actions -->
		<div :class="$style.brandRow">
			<RouterLink :to="{ name: VIEWS.HOMEPAGE }" :class="$style.brandLink">
				<div :class="$style.brandBadge">
					<span :class="$style.badgeSymbol">⚡</span>
				</div>
				<div v-if="!isCollapsed" :class="$style.brandText">
					<span :class="$style.brandTitle">Aethera</span>
					<span :class="$style.brandSubtitle">Workflow Engine</span>
				</div>
			</RouterLink>

			<div :class="$style.headerActions">
				<!-- Universal Add Button -->
				<N8nNavigationDropdown
					v-if="!hideCreate"
					ref="createBtn"
					data-test-id="universal-add"
					:menu="menu"
					:teleport="true"
					@select="handleMenuSelect"
				>
					<N8nIconButton
						:class="$style.actionBtn"
						variant="ghost"
						size="small"
						icon="plus"
						icon-size="medium"
						aria-label="Add new item"
					/>
					<template #[createWorkflowsAppendSlotName]>
						<N8nTooltip
							v-if="sourceControlStore.preferences.branchReadOnly"
							placement="right"
							:content="i18n.baseText('readOnlyEnv.cantAdd.workflow')"
						>
							<N8nIcon :class="$style.iconButton" icon="lock" size="xsmall" />
						</N8nTooltip>
					</template>
					<template #[createCredentialsAppendSlotName]>
						<N8nTooltip
							v-if="sourceControlStore.preferences.branchReadOnly"
							placement="right"
							:content="i18n.baseText('readOnlyEnv.cantAdd.credential')"
						>
							<N8nIcon :class="$style.iconButton" icon="lock" size="xsmall" />
						</N8nTooltip>
					</template>
					<template #[createProjectAppendSlotName]="{ item }">
						<N8nTooltip
							v-if="sourceControlStore.preferences.branchReadOnly"
							placement="right"
							:content="i18n.baseText('readOnlyEnv.cantAdd.project')"
						>
							<N8nIcon :class="$style.iconButton" icon="lock" size="xsmall" />
						</N8nTooltip>
						<N8nTooltip
							v-else-if="item.disabled"
							placement="right"
							:content="projectsLimitReachedMessage"
						>
							<N8nIcon
								v-if="!hasPermissionToCreateProjects"
								:class="$style.iconButton"
								icon="lock"
								size="xsmall"
							/>
							<N8nButton
								variant="subtle"
								v-else
								:size="'mini'"
								:class="$style.upgradeButton"
								@click="handleMenuSelect(item.id)"
							>
								{{ upgradeLabel }}
							</N8nButton>
						</N8nTooltip>
					</template>
				</N8nNavigationDropdown>

				<!-- Toggle Sidebar Button -->
				<KeyboardShortcutTooltip
					:placement="isCollapsed ? 'right' : 'bottom'"
					:label="
						isCollapsed
							? i18n.baseText('mainSidebar.state.expand')
							: i18n.baseText('mainSidebar.state.collapse')
					"
					:show-after="500"
					:shortcut="{ keys: ['['] }"
				>
					<N8nIconButton
						id="toggle-sidebar-button"
						:class="$style.actionBtn"
						variant="ghost"
						size="small"
						icon="panel-left"
						icon-size="medium"
						aria-label="Toggle sidebar"
						@click="toggleCollapse"
					/>
				</KeyboardShortcutTooltip>
			</div>
		</div>



		<!-- Modern Search Pill Bar (Expanded mode) -->
		<div v-if="!isCollapsed && !settingsStore.isCanvasOnly" :class="$style.searchContainer">
			<button
				type="button"
				:class="$style.searchBarPill"
				aria-label="Search"
				@click="openCommandBar"
			>
				<N8nIcon icon="search" size="small" :class="$style.searchIcon" />
				<span :class="$style.searchPlaceholder">Search...</span>
				<kbd :class="$style.shortcutKbd">⌘K</kbd>
			</button>
		</div>

		<!-- Compact Search Button (Collapsed mode) -->
		<KeyboardShortcutTooltip
			v-else-if="isCollapsed && !settingsStore.isCanvasOnly"
			placement="right"
			:show-after="500"
			:label="i18n.baseText('nodeView.openCommandBar')"
			:shortcut="{ keys: ['k'], metaKey: true }"
		>
			<N8nIconButton
				:class="$style.actionBtn"
				variant="ghost"
				size="small"
				icon="search"
				icon-size="medium"
				aria-label="Open command palette"
				@click="openCommandBar"
			/>
		</KeyboardShortcutTooltip>
	</div>
</template>

<style lang="scss" module>
.header {
	display: flex;
	flex-direction: column;
	padding: 14px 14px 10px;
	gap: 12px;
	box-sizing: border-box;

	&.collapsed {
		padding: 12px 6px;
		align-items: center;
		gap: 10px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);

		.brandRow {
			flex-direction: column;
			gap: 8px;
			width: 100%;
			justify-content: center;
			align-items: center;
		}

		.headerActions {
			flex-direction: column;
			gap: 6px;
		}
	}
}

.macWindowDots {
	display: flex;
	align-items: center;
	gap: 7px;
	padding-left: 2px;
	margin-bottom: 2px;
}

.macDot {
	width: 11px;
	height: 11px;
	border-radius: 50%;
	display: inline-block;
}

.closeDot {
	background-color: #ff5f56;
	box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
}

.minimizeDot {
	background-color: #ffbd2e;
	box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
}

.maximizeDot {
	background-color: #27c93f;
	box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
}

.brandRow {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
}

.brandLink {
	display: flex;
	align-items: center;
	gap: 10px;
	text-decoration: none;
	color: inherit;
	overflow: hidden;

	&:hover {
		opacity: 0.92;
	}
}

.brandBadge {
	width: 32px;
	height: 32px;
	min-width: 32px;
	border-radius: 9px;
	background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
}

.badgeSymbol {
	font-size: 16px;
	line-height: 1;
}

.brandText {
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.brandTitle {
	font-size: 14px;
	font-weight: 700;
	letter-spacing: -0.2px;
	color: #ffffff;
	line-height: 1.2;
}

.brandSubtitle {
	font-size: 11px;
	font-weight: 500;
	color: #64748b;
	line-height: 1.2;
}

.headerActions {
	display: flex;
	align-items: center;
	gap: 4px;
}

.actionBtn {
	color: #94a3b8 !important;
	border-radius: 8px !important;

	&:hover {
		color: #ffffff !important;
		background: rgba(255, 255, 255, 0.07) !important;
	}
}

.searchContainer {
	width: 100%;
	margin-top: 2px;
}

.searchBarPill {
	width: 100%;
	height: 34px;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	padding: 0 10px;
	background: #18191f;
	border: 1px solid rgba(255, 255, 255, 0.08);
	border-radius: 10px;
	color: #64748b;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: #1f2129;
		border-color: rgba(255, 255, 255, 0.16);
		color: #94a3b8;
	}
}

.searchIcon {
	margin-right: 8px;
	color: #64748b;
	flex-shrink: 0;
}

.searchPlaceholder {
	font-size: 12.5px;
	font-weight: 500;
	flex: 1;
	text-align: left;
	color: #64748b;
}

.shortcutKbd {
	font-family: inherit;
	font-size: 10.5px;
	font-weight: 600;
	background: #252833;
	color: #94a3b8;
	padding: 2px 6px;
	border-radius: 6px;
	border: 1px solid rgba(255, 255, 255, 0.06);
	line-height: 1.2;
}

.iconButton {
	margin-left: auto;
	margin-right: 5px;
}

.upgradeButton {
	margin-left: auto;
}
</style>
