<script lang="ts" setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { VIEWS } from '@/app/constants';
import { useNodeCreatorStore } from '@/features/shared/nodeCreator/nodeCreator.store';
import { useChatPanelStore } from '@/features/ai/assistant/chatPanel.store';
import { useFocusPanelStore } from '@/app/stores/focusPanel.store';
import { useUIStore } from '@/app/stores/ui.store';
import { useInjectWorkflowId } from '@/app/composables/useInjectWorkflowId';
import { canvasEventBus } from '@/features/workflows/canvas/canvas.eventBus';
import { useProjectsStore } from '@/features/collaboration/projects/projects.store';
import { injectWorkflowDocumentStore } from '@/app/stores/workflowDocument.store';
import KeyboardShortcutTooltip from '@/app/components/KeyboardShortcutTooltip.vue';
import aetheraIcon from '@/features/core/auth/views/aethera-icon.png';
import { useI18n } from '@n8n/i18n';

const router = useRouter();
const route = useRoute();
const i18n = useI18n();
const nodeCreatorStore = useNodeCreatorStore();
const chatPanelStore = useChatPanelStore();
const focusPanelStore = useFocusPanelStore();
const uiStore = useUIStore();
const workflowId = useInjectWorkflowId();
const projectsStore = useProjectsStore();
const workflowDocumentStore = injectWorkflowDocumentStore();

const isChatOpen = computed(() => chatPanelStore.isOpen);
const isFocusPanelOpen = computed(() => focusPanelStore.focusPanelActive);
const isNodeCreatorOpen = computed(() => nodeCreatorStore.isCreateNodeActive);

function goBack() {
	const homeProject = workflowDocumentStore?.value?.homeProject;
	if (homeProject) {
		void router.push({
			name: VIEWS.PROJECTS_WORKFLOWS,
			params: { projectId: homeProject.id },
		});
	} else if (projectsStore.currentProject) {
		void router.push({
			name: VIEWS.PROJECTS_WORKFLOWS,
			params: { projectId: projectsStore.currentProject.id },
		});
	} else {
		void router.push({ name: VIEWS.HOMEPAGE });
	}
}

function onToggleAddNode() {
	if (nodeCreatorStore.isCreateNodeActive) {
		nodeCreatorStore.isCreateNodeActive = false;
	} else {
		nodeCreatorStore.openNodeCreator({
			workflowId: workflowId.value,
		});
	}
}

function onZoomIn() {
	const keyboardEvent = new KeyboardEvent('keydown', {
		key: '+',
		code: 'Equal',
		bubbles: true,
		cancelable: true,
	});
	document.dispatchEvent(keyboardEvent);
}

function onZoomOut() {
	const keyboardEvent = new KeyboardEvent('keydown', {
		key: '-',
		code: 'Minus',
		bubbles: true,
		cancelable: true,
	});
	document.dispatchEvent(keyboardEvent);
}

function onFitView() {
	canvasEventBus.emit('fitView');
}

function onTidyUp() {
	canvasEventBus.emit('tidyUp', {
		source: 'canvas-button',
		trackEvents: true,
		trackHistory: true,
	});
}

function onToggleFocusPanel() {
	focusPanelStore.toggleFocusPanel();
}

function onToggleAssistant() {
	if (chatPanelStore.isOpen) {
		chatPanelStore.close();
	} else {
		void chatPanelStore.open({ mode: 'assistant' });
	}
}
</script>

<template>
	<aside :class="$style.canvasSidebar">
		<!-- Top Section: Back Button / Aethera Logo -->
		<div :class="$style.topSection">
			<button
				type="button"
				:class="$style.backButton"
				:title="i18n.baseText('generic.back') || 'Back to Projects'"
				@click="goBack"
			>
				<img :src="aetheraIcon" alt="Back" :class="$style.brandIcon" />
				<span :class="$style.backArrowOverlay">
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<polyline points="15 18 9 12 15 6" />
					</svg>
				</span>
			</button>
		</div>

		<!-- Centered Main Floating Tool Panel -->
		<div :class="$style.toolPanel">
			<!-- Add Node (+) -->
			<KeyboardShortcutTooltip label="Add Node" :shortcut="{ keys: ['Tab'] }">
				<button
					type="button"
					:class="[$style.toolBtn, isNodeCreatorOpen && $style.active]"
					@click="onToggleAddNode"
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="12" y1="5" x2="12" y2="19" />
						<line x1="5" y1="12" x2="19" y2="12" />
					</svg>
				</button>
			</KeyboardShortcutTooltip>

			<!-- Zoom to Fit / Maximize -->
			<KeyboardShortcutTooltip label="Zoom to Fit" :shortcut="{ keys: ['1'] }">
				<button type="button" :class="$style.toolBtn" @click="onFitView">
					<svg
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
					</svg>
				</button>
			</KeyboardShortcutTooltip>

			<!-- Zoom In (+) -->
			<KeyboardShortcutTooltip label="Zoom In" :shortcut="{ keys: ['+'] }">
				<button type="button" :class="$style.toolBtn" @click="onZoomIn">
					<svg
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="11" cy="11" r="8" />
						<line x1="21" y1="21" x2="16.65" y2="16.65" />
						<line x1="11" y1="8" x2="11" y2="14" />
						<line x1="8" y1="11" x2="14" y2="11" />
					</svg>
				</button>
			</KeyboardShortcutTooltip>

			<!-- Zoom Out (-) -->
			<KeyboardShortcutTooltip label="Zoom Out" :shortcut="{ keys: ['-'] }">
				<button type="button" :class="$style.toolBtn" @click="onZoomOut">
					<svg
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="11" cy="11" r="8" />
						<line x1="21" y1="21" x2="16.65" y2="16.65" />
						<line x1="8" y1="11" x2="14" y2="11" />
					</svg>
				</button>
			</KeyboardShortcutTooltip>

			<!-- Tidy Up / Auto Arrange -->
			<KeyboardShortcutTooltip label="Tidy Up" :shortcut="{ shiftKey: true, altKey: true, keys: ['T'] }">
				<button type="button" :class="$style.toolBtn" @click="onTidyUp">
					<svg
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="m14 12 6-6" />
						<path d="m18 16 3-3" />
						<path d="m8.5 8.5 7 7L13 18l-8 3 3-8 2.5-4.5z" />
					</svg>
				</button>
			</KeyboardShortcutTooltip>

			<div :class="$style.divider" />

			<!-- Side Panel / Node Details Focus -->
			<KeyboardShortcutTooltip label="Toggle Side Panel" :shortcut="{ keys: ['F'] }">
				<button
					type="button"
					:class="[$style.toolBtn, isFocusPanelOpen && $style.active]"
					@click="onToggleFocusPanel"
				>
					<svg
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
						<line x1="15" y1="3" x2="15" y2="21" />
					</svg>
				</button>
			</KeyboardShortcutTooltip>

			<!-- AI Assistant Sparkle Button -->
			<KeyboardShortcutTooltip label="AI Assistant" :shortcut="{ keys: ['A'] }">
				<button
					type="button"
					:class="[$style.toolBtn, isChatOpen && $style.active, $style.aiSparkleBtn]"
					@click="onToggleAssistant"
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						:class="$style.aiSparkleIcon"
					>
						<path
							d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
							fill="url(#aiSparkleGrad)"
						/>
						<path
							d="M19 2L20.2 5.8L24 7L20.2 8.2L19 12L17.8 8.2L14 7L17.8 5.8L19 2Z"
							fill="url(#aiSparkleGrad)"
						/>
						<defs>
							<linearGradient id="aiSparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
								<stop offset="0%" stop-color="#a855f7" />
								<stop offset="100%" stop-color="#ec4899" />
							</linearGradient>
						</defs>
					</svg>
				</button>
			</KeyboardShortcutTooltip>
		</div>
	</aside>
</template>

<style lang="scss" module>
.canvasSidebar {
	position: relative;
	width: 58px;
	min-width: 58px;
	max-width: 58px;
	height: calc(100% - 16px);
	margin: 8px 4px 8px 8px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: space-between;
	padding: 8px 0;
	box-sizing: border-box;
	z-index: 100;
	pointer-events: auto;
}

.topSection {
	width: 100%;
	display: flex;
	justify-content: center;
	padding-top: 4px;
}

.backButton {
	position: relative;
	width: 40px;
	height: 40px;
	border-radius: 12px;
	background: #15171e;
	border: 1px solid rgba(255, 255, 255, 0.08);
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
	transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	overflow: hidden;

	&:hover {
		transform: scale(1.05);
		border-color: rgba(255, 255, 255, 0.2);
		background: #1e212b;

		.brandIcon {
			opacity: 0;
			transform: scale(0.6);
		}

		.backArrowOverlay {
			opacity: 1;
			transform: scale(1);
		}
	}
}

.brandIcon {
	width: 22px;
	height: 22px;
	object-fit: contain;
	transition: all 0.2s ease;
}

.backArrowOverlay {
	position: absolute;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #ffffff;
	opacity: 0;
	transform: scale(1.3);
	transition: all 0.2s ease;
}

.toolPanel {
	margin: auto 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	padding: 6px;
	border-radius: 18px;
	background: #14151a;
	border: 1px solid rgba(255, 255, 255, 0.08);
	box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.65), 0 2px 8px rgba(0, 0, 0, 0.4);
	backdrop-filter: blur(16px);
	-webkit-backdrop-filter: blur(16px);
}

.toolBtn {
	width: 36px;
	height: 36px;
	border-radius: 10px;
	background: transparent;
	border: 1px solid transparent;
	color: #94a3b8;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.16s ease;

	&:hover {
		background: #20232d;
		color: #ffffff;
		border-color: rgba(255, 255, 255, 0.08);
		transform: translateY(-1px);
	}

	&.active {
		background: #282c38;
		color: #38bdf8;
		border-color: rgba(56, 189, 248, 0.3);
		box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
	}
}

.divider {
	width: 20px;
	height: 1px;
	background: rgba(255, 255, 255, 0.08);
	margin: 2px 0;
}

.aiSparkleBtn {
	&:hover {
		background: rgba(168, 85, 247, 0.12);
		border-color: rgba(168, 85, 247, 0.3);
	}

	&.active {
		background: rgba(168, 85, 247, 0.18);
		border-color: rgba(236, 72, 153, 0.4);
		box-shadow: 0 0 12px rgba(168, 85, 247, 0.3);
	}
}

.aiSparkleIcon {
	transition: transform 0.2s ease;

	.toolBtn:hover & {
		transform: rotate(15deg) scale(1.1);
	}
}
</style>
