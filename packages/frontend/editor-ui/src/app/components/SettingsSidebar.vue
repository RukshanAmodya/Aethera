<script lang="ts" setup>
import { onMounted } from 'vue';
import { ABOUT_MODAL_KEY } from '@/app/constants';

import { N8nIcon, N8nLink, N8nMenuItem, N8nText } from '@n8n/design-system';
import { useSettingsItems } from '../composables/useSettingsItems';
import { useAiGateway } from '../composables/useAiGateway';
import { useI18n } from '@n8n/i18n';
import { useRootStore } from '@n8n/stores/useRootStore';
import { useUIStore } from '../stores/ui.store';

const emit = defineEmits<{
	return: [];
}>();

const i18n = useI18n();
const rootStore = useRootStore();
const uiStore = useUIStore();

const { settingsItems, handleSettingsItemSelect } = useSettingsItems();
const { fetchWallet, isEnabled } = useAiGateway();

onMounted(() => {
	if (isEnabled.value) void fetchWallet();
});
</script>

<template>
	<div :class="$style.container">
		<div :class="$style.returnButton" data-test-id="settings-back" @click="emit('return')">
			<div :class="$style.backIconWrapper">
				<N8nIcon icon="arrow-left" size="medium" />
			</div>
			<div :class="$style.headerText">
				<span :class="$style.title">{{ i18n.baseText('settings') }}</span>
			</div>
		</div>

		<div :class="$style.items">
			<N8nMenuItem
				v-for="item in settingsItems"
				:key="item.id"
				:item="item"
				@click="handleSettingsItemSelect(item.id)"
			/>
		</div>

		<div :class="$style.versionContainer">
			<N8nLink size="small" :class="$style.versionLink" @click="uiStore.openModal(ABOUT_MODAL_KEY)">
				Aethera v{{ rootStore.versionCli }}
			</N8nLink>
		</div>
	</div>
</template>

<style lang="scss" module>
.container {
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
	box-sizing: border-box;
	overflow: hidden;
}

.returnButton {
	padding: 16px 14px;
	cursor: pointer;
	display: flex;
	gap: 12px;
	align-items: center;
	border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	user-select: none;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: rgba(255, 255, 255, 0.04);

		.backIconWrapper {
			background-color: rgba(255, 255, 255, 0.12);
			border-color: rgba(255, 255, 255, 0.25);
			color: #fff;
			transform: translateX(-2px);
		}

		.title {
			color: #fff;
		}
	}
}

.backIconWrapper {
	width: 32px;
	height: 32px;
	min-width: 32px;
	border-radius: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.06);
	border: 1px solid rgba(255, 255, 255, 0.1);
	color: #cbd5e1;
	transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.headerText {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.title {
	font-size: 15px;
	font-weight: 700;
	color: #f1f5f9;
	letter-spacing: -0.01em;
	line-height: 1.2;
	transition: color 0.2s ease;
}

.items {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 3px;
	padding: 12px 8px;

	/* Custom dark scrollbar */
	&::-webkit-scrollbar {
		width: 5px;
	}
	&::-webkit-scrollbar-track {
		background: transparent;
	}
	&::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.12);
		border-radius: 10px;
	}
	&::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	/* Menu items inside settings sidebar */
	:global(a[role='menuitem']),
	:global(div[role='menuitem']) {
		color: #e2e8f0 !important;
		border: 1px solid transparent;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		background: transparent;
		border-radius: 10px;

		:global(.n8n-text) {
			color: #e2e8f0 !important;
			font-weight: 500;
		}

		:global(svg),
		:global(.n8n-icon) {
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

			:global(svg),
			:global(.n8n-icon) {
				color: #fff !important;
				transform: scale(1.06);
			}
		}

		/* Active / Selected state */
		&:global(.router-link-active),
		&:global(.active) {
			background: linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.05) 100%) !important;
			border: 1px solid rgba(255, 255, 255, 0.2) !important;
			box-shadow:
				0 4px 18px -2px rgba(0, 0, 0, 0.5),
				inset 0 1px 1px 0 rgba(255, 255, 255, 0.25),
				0 0 16px -4px rgba(255, 255, 255, 0.1) !important;
			backdrop-filter: blur(16px);

			:global(.n8n-text) {
				color: #fff !important;
				font-weight: 600;
				text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
			}

			:global(svg),
			:global(.n8n-icon) {
				color: #fff !important;
				filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.4));
			}
		}
	}
}

.versionContainer {
	padding: 12px 16px;
	border-top: 1px solid rgba(255, 255, 255, 0.06);
	display: flex;
	align-items: center;
}

.versionLink {
	color: #ff6b00 !important;
	font-weight: 600;
	font-size: 12px;
	text-decoration: none;
	opacity: 0.9;
	transition: all 0.2s ease;

	&:hover {
		opacity: 1;
		color: #ff8533 !important;
		text-shadow: 0 0 10px rgba(255, 107, 0, 0.4);
	}
}

@media screen and (max-height: 420px) {
	.versionContainer {
		display: none;
	}
}
</style>
