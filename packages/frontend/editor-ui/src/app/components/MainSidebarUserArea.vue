<script setup lang="ts">
import { VIEWS } from '@/app/constants';
import { useUsersStore } from '@n8n/stores/users.store';
import {
	type IMenuItem,
	N8nAvatar,
	N8nIconButton,
	N8nMenuItem,
	N8nPopover,
} from '@n8n/design-system';
import { useI18n } from '@n8n/i18n';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

defineProps<{ isCollapsed: boolean }>();

const i18n = useI18n();
const router = useRouter();
const usersStore = useUsersStore();

const displayName = computed(() => {
	return usersStore.currentUser?.fullName || usersStore.currentUser?.firstName || 'User';
});

const displayEmail = computed(() => {
	return usersStore.currentUser?.email || 'account@aethera.ai';
});

const userMenuItems = ref<IMenuItem[]>([
	{
		id: 'logout',
		icon: 'door-open',
		label: i18n.baseText('auth.signout'),
	},
]);

const onLogout = () => {
	void router.push({ name: VIEWS.SIGNOUT });
};

const onUserActionToggle = (action: string) => {
	if (action === 'logout') {
		onLogout();
	}
};
</script>

<template>
	<div
		:class="{
			[$style.userAreaWrapper]: true,
			[$style.collapsed]: isCollapsed,
		}"
	>
		<N8nPopover side="right" align="end" :side-offset="12">
			<template #content>
				<div :class="$style.popover">
					<div :class="$style.popoverUserHeader">
						<span :class="$style.popoverUserName">{{ displayName }}</span>
						<span :class="$style.popoverUserEmail">{{ displayEmail }}</span>
					</div>
					<div :class="$style.popoverDivider" />
					<N8nMenuItem
						v-for="action in userMenuItems"
						:key="action.id"
						:item="action"
						:data-test-id="`user-menu-item-${action.id}`"
						@click="() => onUserActionToggle(action.id)"
					/>
				</div>
			</template>
			<template #trigger>
				<!-- Expanded Card Layout -->
				<div
					v-if="!isCollapsed"
					:class="$style.userCard"
					data-test-id="main-sidebar-user-card"
				>
					<div :class="$style.avatarWrapper">
						<N8nAvatar
							:first-name="usersStore.currentUser?.firstName || 'A'"
							:last-name="usersStore.currentUser?.lastName || 'U'"
							size="small"
						/>
					</div>
					<div :class="$style.userInfo">
						<span :class="$style.userName">{{ displayName }}</span>
						<span :class="$style.userEmail">{{ displayEmail }}</span>
					</div>
					<div :class="$style.actionsWrapper">
						<N8nIconButton
							variant="ghost"
							iconOnly
							icon="ellipsis"
							square
							:class="$style.ellipsisBtn"
							:aria-label="i18n.baseText('mainSidebar.userMenu')"
						/>
					</div>
				</div>

				<!-- Collapsed Mini Icon Layout -->
				<div
					v-else
					:class="$style.collapsedAvatar"
					data-test-id="main-sidebar-user-menu"
				>
					<N8nAvatar
						:first-name="usersStore.currentUser?.firstName || 'A'"
						:last-name="usersStore.currentUser?.lastName || 'U'"
						size="small"
					/>
				</div>
			</template>
		</N8nPopover>
	</div>
</template>

<style lang="scss" module>
.userAreaWrapper {
	padding: 8px 12px 14px;
	box-sizing: border-box;
	width: 100%;

	&.collapsed {
		padding: 8px 0 14px;
		display: flex;
		justify-content: center;
		align-items: center;
	}
}

.userCard {
	display: flex;
	align-items: center;
	padding: 8px 10px;
	background: #14151b;
	border: 1px solid rgba(255, 255, 255, 0.08);
	border-radius: 12px;
	cursor: pointer;
	gap: 10px;
	transition: all 0.2s ease;
	width: 100%;
	box-sizing: border-box;

	&:hover {
		background: #1c1e27;
		border-color: rgba(255, 255, 255, 0.16);

		.ellipsisBtn {
			color: #ffffff !important;
		}
	}
}

.avatarWrapper {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.userInfo {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-width: 0;
	overflow: hidden;
}

.userName {
	font-size: 13px;
	font-weight: 600;
	color: #f8fafc;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: 1.25;
}

.userEmail {
	font-size: 11px;
	font-weight: 400;
	color: #94a3b8;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: 1.25;
	margin-top: 2px;
}

.actionsWrapper {
	flex-shrink: 0;
}

.ellipsisBtn {
	color: #94a3b8 !important;
	border-radius: 6px !important;
	padding: 2px !important;

	&:hover {
		color: #ffffff !important;
		background: rgba(255, 255, 255, 0.08) !important;
	}
}

.collapsedAvatar {
	cursor: pointer;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.15s ease;

	&:hover {
		transform: scale(1.06);
	}
}

.popover {
	padding: 8px;
	min-width: 220px;
	background: #181920;
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 10px;
	box-shadow: 0 14px 30px -5px rgba(0, 0, 0, 0.6);
}

.popoverUserHeader {
	display: flex;
	flex-direction: column;
	padding: 6px 10px 8px;
}

.popoverUserName {
	font-size: 13px;
	font-weight: 600;
	color: #f8fafc;
}

.popoverUserEmail {
	font-size: 11.5px;
	color: #94a3b8;
	margin-top: 2px;
}

.popoverDivider {
	height: 1px;
	background: rgba(255, 255, 255, 0.08);
	margin: 4px 0 8px;
}
</style>
