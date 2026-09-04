<script setup lang="ts">
import { computed } from 'vue';
import {
	N8nMenuItem,
	N8nPopover,
	N8nText,
	isCustomMenuItem,
	type IMenuItem,
	type IMenuElement,
} from '@n8n/design-system';
import { CHANGELOG_URL } from '@/app/constants';
import { useVersionsStore } from '@n8n/stores/versions.store';
import VersionUpdateCTA from '@/app/components/VersionUpdateCTA.vue';
import { useUsersStore } from '@n8n/stores/users.store';

import { useI18n } from '@n8n/i18n';

defineProps<{
	items: IMenuItem[];
	isCollapsed: boolean;
}>();

const emit = defineEmits<{
	select: [key: string];
	logout: [];
}>();

const versionsStore = useVersionsStore();
const usersStore = useUsersStore();

const i18n = useI18n();

const whatsNewItems = computed<{ available: boolean; children: IMenuElement[] }>(() => ({
	available: versionsStore.hasVersionUpdates || versionsStore.whatsNewArticles.length > 0,
	children: [
		...versionsStore.whatsNewArticles.map(
			(article) =>
				({
					id: `whats-new-article-${article.id}`,
					label: article.title,
					size: 'small',
					customIconSize: 'small',
					icon: {
						type: 'emoji',
						value: '•',
						color: !versionsStore.isWhatsNewArticleRead(article.id) ? 'primary' : 'text-light',
					},
				}) satisfies IMenuItem,
		),
		{
			id: 'full-changelog',
			icon: 'external-link',
			label: i18n.baseText('mainSidebar.whatsNew.fullChangelog'),
			link: {
				href: CHANGELOG_URL,
				target: '_blank',
			},
			size: 'small',
			customIconSize: 'small',
		},
		...(versionsStore.hasVersionUpdates
			? [
					{
						id: 'version-upgrade-cta',
						component: VersionUpdateCTA,
						props: {
							tooltipText: !usersStore.canUserUpdateVersion
								? i18n.baseText('whatsNew.updateNudgeTooltip')
								: undefined,
							disabled: !usersStore.canUserUpdateVersion,
						},
					},
				]
			: []),
	],
}));

function handleSelect(key: string) {
	emit('select', key);
}

function onLogout() {
	emit('logout');
}
</script>

<template>
	<div
		:class="{
			[$style.bottomMenu]: true,
			[$style.collapsed]: isCollapsed,
		}"
	>
		<div :class="$style.bottomMenuItems">
			<template v-for="item in items" :key="item.id">
				<!-- Help popover -->
				<N8nPopover
					v-if="item.children && item.id === 'help'"
					key="help"
					side="right"
					align="end"
					:side-offset="12"
				>
					<template #content>
						<div :class="$style.popover">
							<template v-for="child in item.children" :key="child.id">
								<component
									:is="child.component"
									v-if="isCustomMenuItem(child)"
									v-bind="child.props"
								/>
								<N8nMenuItem v-else :item="child" @click="() => handleSelect(child.id)" />
							</template>
							<template v-if="whatsNewItems.available">
								<N8nText bold size="small" :class="$style.popoverTitle" color="text-light"
									>What's new</N8nText
								>
								<template v-for="child in whatsNewItems.children" :key="child.id">
									<component
										:is="child.component"
										v-if="isCustomMenuItem(child)"
										v-bind="child.props"
									/>
									<N8nMenuItem v-else :item="child" @click="() => handleSelect(child.id)" />
								</template>
							</template>
						</div>
					</template>
					<template #trigger>
						<N8nMenuItem
							:data-test-id="`main-sidebar-${item.id}`"
							:item="item"
							:compact="isCollapsed"
							@click="() => handleSelect(item.id)"
						/>
					</template>
				</N8nPopover>
				<!-- Settings popover -->
				<N8nPopover
					v-else-if="item.children && item.id === 'settings'"
					key="settings"
					side="right"
					align="end"
					:side-offset="12"
				>
					<template #content>
						<div :class="$style.popover">
							<template v-for="child in item.children" :key="child.id">
								<component
									:is="child.component"
									v-if="isCustomMenuItem(child)"
									v-bind="child.props"
								/>
								<N8nMenuItem v-else :item="child" @click="() => handleSelect(child.id)" />
							</template>
						</div>
					</template>
					<template #trigger>
						<N8nMenuItem
							:data-test-id="`main-sidebar-${item.id}`"
							:item="item"
							:compact="isCollapsed"
							@click="() => handleSelect(item.id)"
						/>
					</template>
				</N8nPopover>
				<!-- Items without children -->
				<N8nMenuItem
					v-else
					:data-test-id="`main-sidebar-${item.id}`"
					:item="item"
					:compact="isCollapsed"
					:class="item.id === 'resource-center' ? $style.resourceCenterMenuItem : undefined"
					@click="() => handleSelect(item.id)"
				/>
			</template>
		</div>
	</div>
</template>

<style lang="scss" module>
.bottomMenu {
	display: flex;
	flex-direction: column;
	margin-top: auto;

	&.collapsed {
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}
}

.bottomMenuItems {
	padding: 4px 10px;
}

.resourceCenterMenuItem {
	:global(.n8n-text) {
		color: #38bdf8 !important;
	}
}

.popover {
	padding: 8px;
	min-width: 240px;
	background: #181920;
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 10px;
	box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
}

.popoverTitle {
	display: block;
	margin-bottom: var(--spacing--3xs);
	padding-left: var(--spacing--3xs);
	margin-top: var(--spacing--xs);
	color: #94a3b8;
}

.divider {
	display: block;
	width: 100%;
	padding-top: 4px;
	border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	margin-bottom: 4px;
}
</style>
