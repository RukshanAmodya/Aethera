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
import { N8nIcon } from '@n8n/design-system';

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
		max-width="500px"
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
					<N8nIcon icon="x" size="small" />
				</button>

				<!-- Sci-fi / Apple Glowing Hero Stage -->
				<div :class="$style.heroStage">
					<div :class="$style.gridPattern" />
					<div :class="$style.heroBgGlow" />
					<div :class="$style.heroSecondaryGlow" />
					
					<!-- Integrated Floating Node Badges with glass aura -->
					<div :class="[$style.floatingBadge, $style.badgeTopLeft]">
						<N8nIcon icon="file-text" size="medium" :class="$style.iconBlue" />
					</div>

					<div :class="[$style.floatingBadge, $style.badgeTopRight]">
						<N8nIcon icon="zap" size="medium" :class="$style.iconAmber" />
					</div>

					<div :class="[$style.floatingBadge, $style.badgeBottomLeft]">
						<N8nIcon icon="globe" size="medium" :class="$style.iconCyan" />
					</div>

					<div :class="[$style.floatingBadge, $style.badgeBottomRight]">
						<N8nIcon icon="bot" size="medium" :class="$style.iconPurple" />
					</div>

					<!-- Circuit trace lines & pulsing data signals -->
					<svg :class="$style.circuitLines" viewBox="0 0 360 200" fill="none">
						<path d="M 60 48 H 130 V 100 H 180" stroke="rgba(99, 102, 241, 0.35)" stroke-width="1.5" stroke-dasharray="4 4" />
						<path d="M 300 48 H 230 V 100 H 180" stroke="rgba(99, 102, 241, 0.35)" stroke-width="1.5" stroke-dasharray="4 4" />
						<path d="M 60 152 H 130 V 100 H 180" stroke="rgba(99, 102, 241, 0.35)" stroke-width="1.5" stroke-dasharray="4 4" />
						<path d="M 300 152 H 230 V 100 H 180" stroke="rgba(99, 102, 241, 0.35)" stroke-width="1.5" stroke-dasharray="4 4" />
						<circle cx="100" cy="100" r="4" fill="#6366f1" :class="$style.pulseDot" />
						<circle cx="260" cy="100" r="4" fill="#6366f1" :class="$style.pulseDot" />
					</svg>

					<!-- Central Glowing Hero Logo -->
					<div :class="$style.shieldContainer">
						<div :class="$style.shieldOuterGlow" />
						<div :class="$style.shieldShape">
							<img :src="aetheraIcon" alt="Aethera Icon" :class="$style.shieldIcon" />
						</div>
					</div>
				</div>

				<!-- Text & Details Section -->
				<div :class="$style.contentSection">
					<div :class="$style.titleRow">
						<h2 :class="$style.title">Aethera Intelligence</h2>
						<span :class="$style.versionTag">
							<span :class="$style.activeIndicator" />
							v{{ rootStore.versionCli }}
						</span>
					</div>
					<p :class="$style.subtitle">
						The next-generation autonomous workflow & AI agent orchestration platform.
					</p>

					<!-- Futuristic Glass Specs Grid -->
					<div :class="$style.specsList">
						<div :class="$style.specItem">
							<span :class="$style.specLabel">Edition</span>
							<span :class="$style.specValue">Enterprise Self-Hosted</span>
						</div>
						<div :class="$style.specItem">
							<span :class="$style.specLabel">Instance ID</span>
							<span :class="[$style.specValue, $style.codeFont]">{{ rootStore.instanceId ? rootStore.instanceId.slice(0, 18) + '...' : 'Local Node' }}</span>
						</div>
						<div :class="$style.specItem">
							<span :class="$style.specLabel">Repository</span>
							<a href="https://github.com/RukshanAmodya/Aethera" target="_blank" rel="noopener" :class="$style.specLink">
								<span>github.com/Aethera</span>
								<N8nIcon icon="arrow-up-right" size="mini" />
							</a>
						</div>
					</div>

					<!-- Quick Actions -->
					<div :class="$style.actionsRow">
						<button type="button" :class="$style.secondaryBtn" @click="copyDebugInfoToClipboard">
							<N8nIcon icon="copy" size="small" />
							<span>Copy Info</span>
						</button>
						<button type="button" :class="$style.secondaryBtn" @click="downloadThirdPartyLicenses">
							<N8nIcon icon="file-text" size="small" />
							<span>Licenses</span>
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
	background: #0d0e14;
	border-radius: 32px;
	overflow: hidden;
	margin: -16px;
	box-shadow: 
		0 32px 80px -15px rgba(0, 0, 0, 0.85),
		0 0 0 1px rgba(255, 255, 255, 0.1),
		inset 0 1px 1px 0 rgba(255, 255, 255, 0.25);
	border: 1px solid rgba(255, 255, 255, 0.1);
	font-family: inherit;
	color: #ffffff;
}

.closeButton {
	position: absolute;
	top: 20px;
	right: 20px;
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background: rgba(15, 17, 26, 0.6);
	backdrop-filter: blur(16px);
	border: 1px solid rgba(255, 255, 255, 0.15);
	color: #cbd5e1;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	z-index: 15;
	transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

	:global(.n8n-icon),
	svg {
		width: 16px !important;
		height: 16px !important;
		min-width: 16px !important;
		min-height: 16px !important;
		max-width: 16px !important;
		max-height: 16px !important;
		color: inherit !important;
	}

	&:hover {
		background: rgba(255, 255, 255, 0.2);
		color: #ffffff;
		transform: scale(1.08);
		border-color: rgba(255, 255, 255, 0.3);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
	}
}

/* Sci-Fi / Apple Glowing Hero Stage */
.heroStage {
	position: relative;
	height: 210px;
	width: 100%;
	background: radial-gradient(circle at 50% 35%, #181b30 0%, #0a0b10 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.gridPattern {
	position: absolute;
	inset: 0;
	background-size: 24px 24px;
	background-image: 
		linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
		linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
	mask-image: radial-gradient(circle, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%);
	pointer-events: none;
}

.heroBgGlow {
	position: absolute;
	width: 260px;
	height: 260px;
	background: radial-gradient(circle, rgba(99, 102, 241, 0.32) 0%, rgba(124, 58, 237, 0.15) 45%, transparent 70%);
	border-radius: 50%;
	pointer-events: none;
	filter: blur(20px);
	animation: floatGlow 6s ease-in-out infinite alternate;
}

.heroSecondaryGlow {
	position: absolute;
	width: 180px;
	height: 180px;
	background: radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, transparent 65%);
	border-radius: 50%;
	pointer-events: none;
	filter: blur(16px);
}

@keyframes floatGlow {
	0% {
		transform: scale(0.9) translateY(-10px);
		opacity: 0.7;
	}
	100% {
		transform: scale(1.15) translateY(10px);
		opacity: 1;
	}
}

.circuitLines {
	position: absolute;
	width: 100%;
	height: 100%;
	pointer-events: none;
	opacity: 0.85;
}

.pulseDot {
	animation: pulseAnimation 2s infinite ease-in-out;
}

@keyframes pulseAnimation {
	0%, 100% {
		transform-origin: center;
		transform: scale(0.8);
		opacity: 0.5;
	}
	50% {
		transform: scale(1.3);
		opacity: 1;
	}
}

.shieldContainer {
	position: relative;
	z-index: 4;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

	&:hover {
		transform: scale(1.08) translateY(-2px);
	}
}

.shieldOuterGlow {
	position: absolute;
	inset: -14px;
	border-radius: 30px;
	background: radial-gradient(circle, rgba(99, 102, 241, 0.65) 0%, transparent 70%);
	filter: blur(14px);
	pointer-events: none;
}

.shieldShape {
	width: 86px;
	height: 86px;
	border-radius: 26px;
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.05) 100%);
	backdrop-filter: blur(16px);
	border: 1px solid rgba(255, 255, 255, 0.28);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 
		0 20px 40px -8px rgba(0, 0, 0, 0.65),
		inset 0 1px 1px 0 rgba(255, 255, 255, 0.45);
}

.shieldIcon {
	width: 48px;
	height: 48px;
	object-fit: contain;
	filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.5));
}

/* Floating Node Badges */
.floatingBadge {
	position: absolute;
	width: 44px;
	height: 44px;
	border-radius: 16px;
	background: rgba(22, 24, 35, 0.85);
	backdrop-filter: blur(12px);
	border: 1px solid rgba(255, 255, 255, 0.14);
	box-shadow: 0 10px 25px -4px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 3;
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

	:global(.n8n-icon),
	svg {
		width: 20px !important;
		height: 20px !important;
		min-width: 20px !important;
		min-height: 20px !important;
		max-width: 20px !important;
		max-height: 20px !important;
	}

	&:hover {
		transform: translateY(-4px) scale(1.12);
		border-color: rgba(255, 255, 255, 0.3);
		box-shadow: 0 16px 30px -4px rgba(0, 0, 0, 0.7), 0 0 16px 0 rgba(255, 255, 255, 0.1);
	}
}

.iconBlue { color: #60a5fa !important; }
.iconAmber { color: #fbbf24 !important; }
.iconCyan { color: #38bdf8 !important; }
.iconPurple { color: #c084fc !important; }

.badgeTopLeft {
	top: 24px;
	left: 36px;
}

.badgeTopRight {
	top: 24px;
	right: 68px;
}

.badgeBottomLeft {
	bottom: 24px;
	left: 36px;
}

.badgeBottomRight {
	bottom: 24px;
	right: 48px;
}

/* Content Section */
.contentSection {
	padding: 24px 28px 28px;
}

.titleRow {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 6px;
}

.title {
	font-size: 21px;
	font-weight: 700;
	letter-spacing: -0.02em;
	color: #ffffff;
	margin: 0;
}

.versionTag {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	background: rgba(99, 102, 241, 0.15);
	color: #a5b4fc;
	font-size: 11.5px;
	font-weight: 600;
	padding: 3px 10px;
	border-radius: 9999px;
	border: 1px solid rgba(99, 102, 241, 0.3);
}

.activeIndicator {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: #34d399;
	box-shadow: 0 0 8px #34d399;
}

.subtitle {
	font-size: 13.5px;
	line-height: 1.5;
	color: #94a3b8;
	margin: 0 0 20px 0;
}

/* Glass Specs List */
.specsList {
	background: rgba(255, 255, 255, 0.035);
	border-radius: 20px;
	padding: 14px 18px;
	border: 1px solid rgba(255, 255, 255, 0.08);
	display: flex;
	flex-direction: column;
	gap: 12px;
	margin-bottom: 22px;
}

.specItem {
	display: flex;
	align-items: center;
	justify-content: space-between;
	font-size: 13px;
}

.specLabel {
	color: #94a3b8;
	font-weight: 500;
}

.specValue {
	color: #f1f5f9;
	font-weight: 600;
}

.codeFont {
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 12px;
	background: rgba(255, 255, 255, 0.08);
	color: #cbd5e1;
	padding: 2px 8px;
	border-radius: 6px;
	border: 1px solid rgba(255, 255, 255, 0.06);
}

.specLink {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	color: #60a5fa;
	font-weight: 600;
	text-decoration: none;
	transition: all 0.2s;

	:global(.n8n-icon),
	svg {
		width: 14px !important;
		height: 14px !important;
		min-width: 14px !important;
		min-height: 14px !important;
		max-width: 14px !important;
		max-height: 14px !important;
		color: inherit !important;
	}

	&:hover {
		color: #93c5fd;
		text-decoration: underline;
	}
}

/* Action Buttons */
.actionsRow {
	display: flex;
	align-items: center;
	gap: 10px;
}

.secondaryBtn {
	flex: 1;
	height: 42px;
	border-radius: 14px;
	background: rgba(255, 255, 255, 0.06);
	border: 1px solid rgba(255, 255, 255, 0.1);
	color: #e2e8f0;
	font-size: 12.5px;
	font-weight: 600;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	transition: all 0.2s ease;

	:global(.n8n-icon),
	svg {
		width: 16px !important;
		height: 16px !important;
		min-width: 16px !important;
		min-height: 16px !important;
		max-width: 16px !important;
		max-height: 16px !important;
	}

	&:hover {
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(255, 255, 255, 0.18);
		color: #ffffff;
		transform: translateY(-1px);
	}

	&:active {
		transform: translateY(0);
	}
}

.primaryDoneBtn {
	flex: 1;
	height: 42px;
	border-radius: 14px;
	background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
	border: 1px solid rgba(255, 255, 255, 0.2);
	color: #ffffff;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4px 16px -2px rgba(99, 102, 241, 0.5), inset 0 1px 1px 0 rgba(255, 255, 255, 0.3);
	transition: all 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, #4338ca 0%, #4f46e5 100%);
		box-shadow: 0 6px 20px -2px rgba(99, 102, 241, 0.7);
		transform: translateY(-1px);
	}

	&:active {
		transform: translateY(0);
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

