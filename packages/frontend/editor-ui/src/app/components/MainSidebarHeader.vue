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
import aetheraLogo from '@/features/core/auth/views/aethera-logo.png';
import aetheraIcon from '@/features/core/auth/views/aethera-icon.png';

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
		<!-- Brand Row: Logo + Actions -->
		<div :class="$style.brandRow">
			<RouterLink :to="{ name: VIEWS.HOMEPAGE }" :class="$style.brandLink">
				<img v-if="isCollapsed" :src="aetheraIcon" alt="Aethera" :class="$style.collapsedIcon" />
				<img v-else :src="aetheraLogo" alt="Aethera" :class="$style.realLogo" />
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

				<!-- Toggle Sidebar Button (Circular chevron matching user design) -->
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
					<button
						id="toggle-sidebar-button"
						type="button"
						:class="$style.collapseChevronBtn"
						:aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
						@click="toggleCollapse"
					>
						<N8nIcon
							:icon="isCollapsed ? 'chevron-right' : 'chevron-left'"
							size="xsmall"
							:class="$style.collapseIcon"
						/>
					</button>
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
				<kbd :class="$style.shortcutKbd">
					<span>⌘</span>
					<span>K</span>
				</kbd>
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
	width: 100%;

	&.collapsed {
		padding: 12px 0 10px;
		align-items: center;
		justify-content: center;
		gap: 10px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);

		.brandRow {
			flex-direction: column;
			gap: 8px;
			width: 100%;
			justify-content: center;
			align-items: center;
		}

		.brandLink {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%;
		}

		.headerActions {
			flex-direction: column;
			gap: 6px;
			width: 100%;
			align-items: center;
			justify-content: center;
		}
	}
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
	text-decoration: none;
	color: inherit;
	overflow: hidden;
	transition: opacity 0.2s ease;

	&:hover {
		opacity: 0.85;
	}
}

.realLogo {
	height: 36px;
	width: auto;
	max-width: 140px;
	object-fit: contain;
	display: block;
}

.collapsedIcon {
	width: 28px;
	height: 28px;
	object-fit: contain;
	display: block;
	border-radius: 6px;
}

.headerActions {
	display: flex;
	align-items: center;
	gap: 4px;
}

:global(.el-menu),
:global(.el-sub-menu),
:global(.el-sub-menu__title) {
	background: transparent !important;
	background-color: transparent !important;
	border: none !important;

	&:hover,
	&:focus,
	&:active,
	&.is-active {
		background: transparent !important;
		background-color: transparent !important;
	}
}

.actionBtn {
	color: #cbd5e1 !important;
	background: transparent !important;
	border-radius: 10px !important;
	border: 1px solid transparent !important;
	transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;

	&:hover {
		color: #fff !important;
		background: rgba(255, 255, 255, 0.1) !important;
		border-color: rgba(255, 255, 255, 0.15) !important;
		transform: scale(1.05);
	}

	&:active {
		transform: scale(0.96);
	}
}

.collapseChevronBtn {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.04);
	border: 1px solid rgba(255, 255, 255, 0.08);
	color: #94a3b8;
	cursor: pointer;
	padding: 0;
	transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

	&:hover {
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(255, 255, 255, 0.2);
		color: #fff;
		transform: scale(1.06);
	}

	&:active {
		transform: scale(0.95);
	}
}

.collapseIcon {
	display: flex;
	align-items: center;
	justify-content: center;
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
	background: #14151b;
	border: 1px solid rgba(255, 255, 255, 0.08);
	border-radius: 8px;
	color: #94a3b8;
	cursor: pointer;
	transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

	&:hover {
		background: #1c1e27;
		border-color: rgba(255, 255, 255, 0.16);
		color: #fff;
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
	color: #94a3b8;
}

.shortcutKbd {
	display: inline-flex;
	align-items: center;
	gap: 2px;
	font-family: inherit;
	font-size: 10.5px;
	font-weight: 600;
	background: #232530;
	color: #cbd5e1;
	padding: 2px 6px;
	border-radius: 6px;
	border: 1px solid rgba(255, 255, 255, 0.08);
	line-height: 1.2;
	letter-spacing: 0.5px;
}

.iconButton {
	margin-left: auto;
	margin-right: 5px;
}

.upgradeButton {
	margin-left: auto;
}
</style>
