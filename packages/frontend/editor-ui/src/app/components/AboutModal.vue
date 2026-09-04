<script setup lang="ts">
import { onMounted } from 'vue';
import { createEventBus } from '@n8n/utils/event-bus';
import Modal from './Modal.vue';
import { ABOUT_MODAL_KEY } from '../constants';
import { useRootStore } from '@n8n/stores/useRootStore';
import { useToast } from '@n8n/composables/useToast';
import { useClipboard } from '@n8n/composables/useClipboard';
import { useDebugInfo } from '@/app/composables/useDebugInfo';
import { useInstanceRegistryStore } from '@n8n/frontend-module-instance-registry';
import { useI18n } from '@n8n/i18n';
import { getThirdPartyLicenses } from '@n8n/rest-api-client';

import aetheraIcon from '@/features/core/auth/views/aethera-icon.png';

const modalBus = createEventBus();
const toast = useToast();
const i18n = useI18n();
const debugInfo = useDebugInfo();
const clipboard = useClipboard();
const rootStore = useRootStore();
const instanceRegistryStore = useInstanceRegistryStore();

onMounted(async () => {
	await instanceRegistryStore.fetchClusterInfo();
});

const closeDialog = () => {
	modalBus.emit('close');
};

const downloadThirdPartyLicenses = async () => {
	try {
		const thirdPartyLicenses = await getThirdPartyLicenses(rootStore.restApiContext);

		const blob = new File([thirdPartyLicenses], 'THIRD_PARTY_LICENSES.md', {
			type: 'text/markdown',
		});
		window.open(URL.createObjectURL(blob));
	} catch (error) {
		toast.showToast({
			title: i18n.baseText('about.thirdPartyLicenses.downloadError'),
			message: error.message,
			type: 'error',
		});
	}
};

const copyDebugInfoToClipboard = async () => {
	toast.showToast({
		title: i18n.baseText('about.debug.toast.title'),
		message: i18n.baseText('about.debug.toast.message'),
		type: 'info',
		duration: 5000,
	});
	await clipboard.copy(debugInfo.generateDebugInfo());
};
</script>

<template>
	<Modal
		max-width="480px"
		:event-bus="modalBus"
		:name="ABOUT_MODAL_KEY"
		:center="true"
		:show-close="false"
		custom-class="aethera-about-dialog"
	>
		<template #content>
			<div :class="$style.cardWrapper">
				<!-- Close circular icon button -->
				<button type="button" :class="$style.closeButton" aria-label="Close" @click="closeDialog">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>

				<!-- Applish Visual Hero Stage -->
				<div :class="$style.heroStage">
					<div :class="$style.heroBgGlow" />
					
					<!-- Integrated Floating App Badges (connecting nodes) -->
					<div :class="[$style.floatingBadge, $style.badgeTopLeft]">
						<div :class="$style.badgeIconDoc">
							<span style="font-size: 14px;">📄</span>
						</div>
					</div>

					<div :class="[$style.floatingBadge, $style.badgeTopRight]">
						<div :class="$style.badgeIconMail">
							<span style="font-size: 14px;">⚡</span>
						</div>
					</div>

					<div :class="[$style.floatingBadge, $style.badgeBottomLeft]">
						<div :class="$style.badgeIconDrive">
							<span style="font-size: 14px;">🌐</span>
						</div>
					</div>

					<div :class="[$style.floatingBadge, $style.badgeBottomRight]">
						<div :class="$style.badgeIconCloud">
							<span style="font-size: 14px;">🤖</span>
						</div>
					</div>

					<!-- Circuit trace lines -->
					<svg :class="$style.circuitLines" viewBox="0 0 340 180" fill="none">
						<path d="M 50 45 H 120 V 90 H 170" stroke="rgba(37, 99, 235, 0.2)" stroke-width="1.5" stroke-dasharray="3 3" />
						<path d="M 290 45 H 220 V 90 H 170" stroke="rgba(37, 99, 235, 0.2)" stroke-width="1.5" stroke-dasharray="3 3" />
						<path d="M 55 135 H 120 V 90 H 170" stroke="rgba(37, 99, 235, 0.2)" stroke-width="1.5" stroke-dasharray="3 3" />
						<path d="M 285 135 H 220 V 90 H 170" stroke="rgba(37, 99, 235, 0.2)" stroke-width="1.5" stroke-dasharray="3 3" />
						<circle cx="95" cy="90" r="3.5" fill="#3b82f6" />
						<circle cx="245" cy="90" r="3.5" fill="#3b82f6" />
					</svg>

					<!-- Central Shield / Hero Icon -->
					<div :class="$style.shieldContainer">
						<div :class="$style.shieldShape">
							<img :src="aetheraIcon" alt="Aethera Icon" :class="$style.shieldIcon" />
						</div>
					</div>
				</div>

				<!-- Text & Details Section -->
				<div :class="$style.contentSection">
					<div :class="$style.titleRow">
						<h2 :class="$style.title">Aethera Intelligence</h2>
						<span :class="$style.versionTag">v{{ rootStore.versionCli }}</span>
					</div>
					<p :class="$style.subtitle">
						The next-generation autonomous workflow & AI agent orchestration platform.
					</p>

					<!-- Minimalist Specs Grid -->
					<div :class="$style.specsList">
						<div :class="$style.specItem">
							<span :class="$style.specLabel">Edition</span>
							<span :class="$style.specValue">Enterprise Self-Hosted</span>
						</div>
						<div :class="$style.specItem">
							<span :class="$style.specLabel">Instance ID</span>
							<span :class="[$style.specValue, $style.codeFont]">{{ rootStore.instanceId ? rootStore.instanceId.slice(0, 16) + '...' : 'Local' }}</span>
						</div>
						<div :class="$style.specItem">
							<span :class="$style.specLabel">Repository</span>
							<a href="https://github.com/RukshanAmodya/Aethera" target="_blank" rel="noopener" :class="$style.specLink">
								github.com/Aethera ↗
							</a>
						</div>
					</div>

					<!-- Quick Actions -->
					<div :class="$style.actionsRow">
						<button type="button" :class="$style.secondaryBtn" @click="copyDebugInfoToClipboard">
							<span>📋 Copy System Info</span>
						</button>
						<button type="button" :class="$style.secondaryBtn" @click="downloadThirdPartyLicenses">
							<span>📜 Licenses</span>
						</button>
						<button type="button" :class="$style.primaryDoneBtn" @click="closeDialog">
							<span>Done</span>
						</button>
					</div>
				</div>
			</div>
		</template>
	</Modal>
</template>

<style module lang="scss">
.cardWrapper {
	position: relative;
	background: #ffffff;
	border-radius: 28px;
	overflow: hidden;
	margin: -16px;
	box-shadow: 0 25px 60px -12px rgba(15, 23, 42, 0.25);
	border: 1px solid rgba(226, 232, 240, 0.8);
	font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
}

.closeButton {
	position: absolute;
	top: 16px;
	right: 16px;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.85);
	backdrop-filter: blur(8px);
	border: 1px solid rgba(0, 0, 0, 0.06);
	color: #64748b;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	z-index: 10;
	transition: all 0.2s ease;

	&:hover {
		background: #ffffff;
		color: #0f172a;
		transform: scale(1.06);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
}

/* Applish Visual Hero Stage */
.heroStage {
	position: relative;
	height: 200px;
	width: 100%;
	background: linear-gradient(180deg, #f0f7ff 0%, #ffffff 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	border-bottom: 1px solid rgba(226, 232, 240, 0.6);
}

.heroBgGlow {
	position: absolute;
	width: 220px;
	height: 220px;
	background: radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, rgba(255, 255, 255, 0) 70%);
	border-radius: 50%;
	pointer-events: none;
}

.circuitLines {
	position: absolute;
	width: 100%;
	height: 100%;
	pointer-events: none;
	opacity: 0.65;
}

.shieldContainer {
	position: relative;
	z-index: 4;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

	&:hover {
		transform: scale(1.04);
	}
}

.shieldShape {
	width: 90px;
	height: 98px;
	background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
	clip-path: polygon(50% 0%, 100% 12%, 100% 70%, 50% 100%, 0% 70%, 0% 12%);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 16px 32px -4px rgba(37, 99, 235, 0.45);
	position: relative;

	&::after {
		content: '';
		position: absolute;
		inset: 2px;
		clip-path: polygon(50% 0%, 100% 12%, 100% 70%, 50% 100%, 0% 70%, 0% 12%);
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 65%);
		pointer-events: none;
	}
}

.shieldIcon {
	width: 44px;
	height: 44px;
	object-fit: contain;
	filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

/* Floating Badges */
.floatingBadge {
	position: absolute;
	width: 42px;
	height: 42px;
	border-radius: 12px;
	background: #ffffff;
	box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.04);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 3;
	transition: all 0.3s ease;

	&:hover {
		transform: translateY(-3px) scale(1.08);
		box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.15);
	}
}

.badgeTopLeft {
	top: 24px;
	left: 48px;
}

.badgeTopRight {
	top: 24px;
	right: 48px;
}

.badgeBottomLeft {
	bottom: 24px;
	left: 54px;
}

.badgeBottomRight {
	bottom: 24px;
	right: 54px;
}

/* Content Section */
.contentSection {
	padding: 24px 28px 26px;
}

.titleRow {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 6px;
}

.title {
	font-size: 22px;
	font-weight: 700;
	letter-spacing: -0.02em;
	color: #0f172a;
	margin: 0;
}

.versionTag {
	background: #eff6ff;
	color: #2563eb;
	font-size: 12px;
	font-weight: 600;
	padding: 2px 9px;
	border-radius: 9999px;
	border: 1px solid rgba(37, 99, 235, 0.15);
}

.subtitle {
	font-size: 14px;
	line-height: 1.5;
	color: #64748b;
	margin: 0 0 20px 0;
}

/* Specs List */
.specsList {
	background: #f8fafc;
	border-radius: 16px;
	padding: 12px 16px;
	border: 1px solid #f1f5f9;
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-bottom: 22px;
}

.specItem {
	display: flex;
	align-items: center;
	justify-content: space-between;
	font-size: 13px;
}

.specLabel {
	color: #64748b;
	font-weight: 500;
}

.specValue {
	color: #1e293b;
	font-weight: 600;
}

.codeFont {
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 12px;
	background: #e2e8f0;
	padding: 2px 6px;
	border-radius: 6px;
}

.specLink {
	color: #2563eb;
	font-weight: 600;
	text-decoration: none;
	transition: color 0.2s;

	&:hover {
		color: #1d4ed8;
		text-decoration: underline;
	}
}

/* Action Buttons */
.actionsRow {
	display: flex;
	align-items: center;
	gap: 8px;
}

.secondaryBtn {
	flex: 1;
	height: 38px;
	border-radius: 10px;
	background: #f1f5f9;
	border: 1px solid #e2e8f0;
	color: #334155;
	font-size: 12.5px;
	font-weight: 600;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;

	&:hover {
		background: #e2e8f0;
		color: #0f172a;
	}

	&:active {
		transform: scale(0.98);
	}
}

.primaryDoneBtn {
	flex: 1;
	height: 38px;
	border-radius: 10px;
	background: #2563eb;
	border: 1px solid #2563eb;
	color: #ffffff;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
	transition: all 0.2s ease;

	&:hover {
		background: #1d4ed8;
		border-color: #1d4ed8;
		box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
	}

	&:active {
		transform: scale(0.98);
	}
}
</style>

<style lang="scss">
.aethera-about-dialog {
	&.el-dialog {
		background: transparent !important;
		box-shadow: none !important;
		border: none !important;
		padding: 0 !important;
	}

	.el-dialog__header {
		display: none !important;
	}

	.el-dialog__body {
		padding: 0 !important;
		background: transparent !important;
	}

	.modal-content {
		padding: 0 !important;
		margin: 0 !important;
		overflow: visible !important;
	}
}
</style>
