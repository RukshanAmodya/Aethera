<script lang="ts" setup>
import { computed, ref, useCssModule, watch } from 'vue';
import { useNodeConnections } from '@/app/composables/useNodeConnections';
import { useI18n } from '@n8n/i18n';
import { useCanvasNode } from '../../../../composables/useCanvasNode';
import type { CanvasNodeDefaultRender } from '../../../../canvas.types';
import { injectCanvasRenderData } from '@/features/workflows/canvas/canvas.utils';
import { useCanvas } from '../../../../composables/useCanvas';
import { useZoomAdjustedValues } from '../../../../composables/useZoomAdjustedValues';
import CanvasNodeSettingsIcons from './parts/CanvasNodeSettingsIcons.vue';
import { useNodePrivateCredential } from '@/features/resolvers/composables/useNodePrivateCredential';
import { useNodeHelpers } from '@/app/composables/useNodeHelpers';
import { calculateNodeSize } from '@/app/utils/nodeViewUtils';
import ExperimentalInPlaceNodeSettings from '../../../../experimental/components/ExperimentalEmbeddedNodeDetails.vue';
import CanvasNodeTooltip from './parts/CanvasNodeTooltip.vue';
import CanvasNodeDisabledStrikeThrough from './parts/CanvasNodeDisabledStrikeThrough.vue';
import CanvasNodeStatusIcons from './parts/CanvasNodeStatusIcons.vue';
import NodeIcon from '@/app/components/NodeIcon.vue';
import { useRoute } from 'vue-router';
import { VIEWS } from '@/app/constants';
import { getNodeIconSize, type NodeIconSource } from '@/app/utils/nodeIcon';

const $style = useCssModule();
const i18n = useI18n();

const emit = defineEmits<{
	'open:contextmenu': [event: MouseEvent];
	activate: [id: string, event: MouseEvent];
	'replace:node': [id: string];
}>();

const { initialized, viewport, isExperimentalNdvActive } = useCanvas();
const { calculateNodeBorderOpacityStyle } = useZoomAdjustedValues(viewport);
const route = useRoute();
const {
	id,
	name,
	label,
	subtitle,
	connections,
	isDisabled,
	isReadOnly,
	isSelected,
	executionStatus,
	executionWaiting,
	executionWaitingForNext,
	executionRunning,
	hasRunData,
	runDataIterations,
	render,
	isNotInstalledCommunityNode,
	node,
} = useCanvasNode();
const { hasPrivateCredential, tooltipText: privateCredentialTooltip } =
	useNodePrivateCredential(name);
const renderData = injectCanvasRenderData();
const inputs = computed(() => renderData.value.nodeInputsByNodeId.get(id.value)?.value ?? []);
const outputs = computed(() => renderData.value.nodeOutputsByNodeId.get(id.value)?.value ?? []);
const hasExecutionErrors = computed(
	() => (renderData.value.executionIssuesByNodeId.get(id.value)?.value?.length ?? 0) > 0,
);
const hasPinnedData = computed(
	() =>
		!renderData.value.isExecutionDataDisplayed &&
		!!renderData.value.pinnedDataByNodeName[name.value],
);
const hasExecutionPinData = computed(
	() =>
		renderData.value.isExecutionDataDisplayed &&
		!!renderData.value.executionPinDataByNodeId.get(id.value)?.value,
);
const hasSubstitutedOutput = computed(() => hasPinnedData.value || hasExecutionPinData.value);
const { mainOutputs, mainOutputConnections, mainInputs, mainInputConnections, nonMainInputs } =
	useNodeConnections({
		inputs,
		outputs,
		connections,
	});

const nodeHelpers = useNodeHelpers();
const renderOptions = computed(() => render.value.options as CanvasNodeDefaultRender['options']);
const isDemoRoute = computed(() => route.name === VIEWS.DEMO);

const classes = computed(() => {
	const waiting = Boolean(executionWaiting.value || executionStatus.value === 'waiting');
	const running = Boolean(executionRunning.value || executionWaitingForNext.value);
	return {
		[$style.node]: true,
		[$style.selected]: isSelected.value,
		[$style.disabled]:
			isDisabled.value || (isNotInstalledCommunityNode.value && !isDemoRoute.value),
		[$style.success]: Boolean(
			hasRunData.value && executionStatus.value === 'success' && !hasExecutionPinData.value,
		),
		[$style.error]: hasExecutionErrors.value,
		[$style.running]: running,
		[$style.waiting]: waiting,
		[$style.pinned]: hasSubstitutedOutput.value,
		[$style.configurable]: renderOptions.value.configurable,
		[$style.configuration]: renderOptions.value.configuration,
		[$style.trigger]: renderOptions.value.trigger,
		[$style.warning]: renderOptions.value.dirtiness !== undefined,
		[$style.placeholder]: renderOptions.value.placeholder,
		waiting,
		running,
	};
});

const iconSize = computed(() => {
	const iconName = iconSource.value?.type === 'icon' ? iconSource.value.name : undefined;
	if (renderOptions.value.configuration) return getNodeIconSize('configuration', iconName);
	return getNodeIconSize('canvas', iconName);
});

const nodeSize = computed(() =>
	calculateNodeSize(
		renderOptions.value.configuration ?? false,
		renderOptions.value.configurable ?? false,
		mainInputs.value.length,
		mainOutputs.value.length,
		nonMainInputs.value.length,
		isExperimentalNdvActive.value,
	),
);

const nodeBorderOpacityStyle = calculateNodeBorderOpacityStyle();

const styles = computed(() => ({
	'--canvas-node--width': `${nodeSize.value.width}px`,
	'--canvas-node--height': `${nodeSize.value.height}px`,
	'--node--icon--size': `${iconSize.value}px`,
	...nodeBorderOpacityStyle.value,
}));

const dataTestId = computed(() => {
	let type = 'default';
	if (renderOptions.value.configurable) {
		type = 'configurable';
	} else if (renderOptions.value.configuration) {
		type = 'configuration';
	} else if (renderOptions.value.trigger) {
		type = 'trigger';
	}

	return `canvas-${type}-node`;
});

const isStrikethroughVisible = computed(() => {
	const isSingleMainInputNode =
		mainInputs.value.length === 1 && mainInputConnections.value.length <= 1;
	const isSingleMainOutputNode =
		mainOutputs.value.length === 1 && mainOutputConnections.value.length <= 1;

	return isDisabled.value && isSingleMainInputNode && isSingleMainOutputNode;
});

const iconSource = computed(() => {
	if (renderOptions.value.placeholder) {
		return {
			type: 'icon',
			name: 'plus',
		} as NodeIconSource;
	}

	const source = renderOptions.value.icon;
	// When the node uses a private credential, that icon takes over the node badge
	// slot, replacing any node-specific badge (e.g. the HTTP Request globe).
	if (hasPrivateCredential.value && source) {
		const badge: NodeIconSource['badge'] = {
			type: 'icon',
			name: 'user-round-key',
			tooltip: privateCredentialTooltip.value,
		};
		return { ...source, badge };
	}

	return source;
});

const showTooltip = ref(false);

watch(initialized, () => {
	if (initialized.value) {
		showTooltip.value = true;
	}
});

watch(viewport, () => {
	showTooltip.value = false;
	setTimeout(() => {
		showTooltip.value = true;
	}, 0);
});

interface CategoryInfo {
	label: string;
	color: string;
	bg: string;
	border: string;
}

const bentoCategory = computed<CategoryInfo>(() => {
	const type = (node?.data?.value?.type || '').toLowerCase();
	const nameStr = (label.value || '').toLowerCase();

	if (
		renderOptions.value.trigger ||
		type.includes('trigger') ||
		type.includes('webhook') ||
		nameStr.includes('source') ||
		nameStr.includes('user query') ||
		nameStr.includes('input')
	) {
		return {
			label: 'Input Source',
			color: '#10b981',
			bg: 'rgba(16, 185, 129, 0.12)',
			border: 'rgba(16, 185, 129, 0.28)',
		};
	}

	if (
		type.includes('switch') ||
		type.includes('if') ||
		type.includes('router') ||
		type.includes('code') ||
		type.includes('function') ||
		type.includes('subworkflow') ||
		nameStr.includes('router') ||
		nameStr.includes('intent')
	) {
		return {
			label: 'System Worker',
			color: '#f59e0b',
			bg: 'rgba(245, 158, 11, 0.12)',
			border: 'rgba(245, 158, 11, 0.28)',
		};
	}

	if (
		type.includes('openai') ||
		type.includes('anthropic') ||
		type.includes('claude') ||
		type.includes('llm') ||
		type.includes('agent') ||
		type.includes('chain') ||
		type.includes('model') ||
		nameStr.includes('claude') ||
		nameStr.includes('gpt') ||
		nameStr.includes('ai')
	) {
		return {
			label: 'AI Worker',
			color: '#3b82f6',
			bg: 'rgba(59, 130, 246, 0.12)',
			border: 'rgba(59, 130, 246, 0.28)',
		};
	}

	if (
		type.includes('eval') ||
		type.includes('assert') ||
		type.includes('filter') ||
		type.includes('validate') ||
		nameStr.includes('eval') ||
		nameStr.includes('score') ||
		nameStr.includes('check')
	) {
		return {
			label: 'Evaluation Worker',
			color: '#ec4899',
			bg: 'rgba(236, 72, 153, 0.12)',
			border: 'rgba(236, 72, 153, 0.28)',
		};
	}

	if (
		type.includes('memory') ||
		type.includes('redis') ||
		type.includes('cache') ||
		type.includes('buffer') ||
		type.includes('window') ||
		nameStr.includes('memory') ||
		nameStr.includes('context')
	) {
		return {
			label: 'Memory Layer',
			color: '#8b5cf6',
			bg: 'rgba(139, 92, 246, 0.12)',
			border: 'rgba(139, 92, 246, 0.28)',
		};
	}

	return {
		label: 'System Worker',
		color: '#6366f1',
		bg: 'rgba(99, 102, 241, 0.12)',
		border: 'rgba(99, 102, 241, 0.28)',
	};
});

const bentoStatusLabel = computed(() => {
	if (isDisabled.value) return 'DISABLED';
	if (executionStatus.value === 'running') return 'RUNNING';
	if (executionStatus.value === 'waiting') return 'WAITING';
	if (executionStatus.value === 'error') return 'ERROR';
	if (hasRunData.value || executionStatus.value === 'success') {
		if (bentoCategory.value.label === 'Input Source') return 'ANSWER';
		if (bentoCategory.value.label === 'Evaluation Worker') return 'EVALUATED';
		return 'COMPLETED';
	}
	return 'IDLE';
});

const bentoTimingText = computed(() => {
	if (hasRunData.value || executionStatus.value === 'success') return '0.1 SEC';
	return 'READY';
});

const bentoCalculatedTokens = computed(() => {
	if (runDataIterations.value && runDataIterations.value > 1) {
		return `${runDataIterations.value} RUNS`;
	}
	if (bentoCategory.value.label === 'AI Worker') return '213 TOKEN';
	if (bentoCategory.value.label === 'Evaluation Worker') return '48 TOKEN';
	if (bentoCategory.value.label === 'Input Source') return 'INPUT READY';
	if (hasRunData.value) return '1 ITEM';
	return '0 TOKEN';
});

const bentoBulletDetails = computed(() => {
	const nameStr = (label.value || '').toLowerCase();
	if (nameStr.includes('intent') || nameStr.includes('router')) {
		return ['Categorizes incoming prompt', 'Routes to specialized sub-agents'];
	}
	if (nameStr.includes('claude') || nameStr.includes('gpt') || bentoCategory.value.label === 'AI Worker') {
		return ['Contextual reasoning model', 'High-fidelity analytical synthesis'];
	}
	if (nameStr.includes('eval') || bentoCategory.value.label === 'Evaluation Worker') {
		return ['Coherence & safety verification', 'Confidence threshold scoring'];
	}
	if (nameStr.includes('memory') || bentoCategory.value.label === 'Memory Layer') {
		return ['Stores multi-turn conversational state', 'Low-latency key-value retrieval'];
	}
	if (subtitle.value) {
		return [subtitle.value];
	}
	return ['Executes standard pipeline task', 'Provides structured payload output'];
});

function openContextMenu(event: MouseEvent) {
	emit('open:contextmenu', event);
}

function onActivate(event: MouseEvent) {
	if (renderOptions.value.placeholder) {
		emit('replace:node', id.value);
		return;
	}

	emit('activate', id.value, event);
}
</script>

<template>
	<ExperimentalInPlaceNodeSettings
		v-if="isExperimentalNdvActive"
		:node-id="id"
		:class="classes"
		:style="styles"
		:is-read-only="isReadOnly"
		:is-configurable="renderOptions.configurable ?? false"
	/>
	<div
		v-else
		:class="classes"
		:style="styles"
		:data-test-id="dataTestId"
		@contextmenu="openContextMenu"
		@dblclick.stop="onActivate"
	>
		<CanvasNodeTooltip v-if="renderOptions.tooltip" :visible="showTooltip" />
		<NodeIcon
			:icon-source="iconSource"
			:size="iconSize"
			:shrink="false"
			:disabled="isDisabled"
			:class="$style.icon"
		/>
		<CanvasNodeSettingsIcons
			v-if="
				!renderOptions.configuration &&
				!isDisabled &&
				!(hasSubstitutedOutput && !nodeHelpers.isProductionExecutionPreview.value)
			"
		/>
		<CanvasNodeDisabledStrikeThrough v-if="isStrikethroughVisible" />
		<div :class="$style.description">
			<div v-if="label" :class="$style.label">
				{{ label }}
			</div>
			<div v-if="isDisabled" :class="$style.disabledLabel">
				({{ i18n.baseText('node.disabled') }})
			</div>
			<div v-if="subtitle && !isNotInstalledCommunityNode" :class="$style.subtitle">
				{{ subtitle }}
			</div>
		</div>

		<!-- Sensa Bento Card Detail Block -->
		<div
			v-if="!renderOptions.configuration && !renderOptions.placeholder"
			:class="$style.bentoCard"
		>
			<!-- Top Floating Category Badge -->
			<div
				:class="$style.categoryBadge"
				:style="{
					color: bentoCategory.color,
					backgroundColor: bentoCategory.bg,
					borderColor: bentoCategory.border,
				}"
			>
				<span :class="$style.dot" :style="{ backgroundColor: bentoCategory.color }" />
				<span :class="$style.categoryText">{{ bentoCategory.label }}</span>
			</div>

			<!-- Status & Execution Time Row -->
			<div :class="$style.metaRow">
				<div :class="[$style.statusBadge, $style[bentoStatusLabel.toLowerCase()]]">
					{{ bentoStatusLabel }}
				</div>
				<div :class="$style.timer">
					<svg
						width="10"
						height="10"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="12" cy="12" r="10" />
						<polyline points="12 6 12 12 16 14" />
					</svg>
					<span>{{ bentoTimingText }}</span>
				</div>
			</div>

			<!-- Bento Dynamic Bullet Details / Context Rule Texts -->
			<div :class="$style.detailsList">
				<div v-for="(rule, idx) in bentoBulletDetails" :key="idx" :class="$style.ruleItem">
					<span :class="$style.bullet">•</span>
					<span :class="$style.ruleText">{{ rule }}</span>
				</div>
			</div>

			<!-- Card Footer (Status and Token/Run Counter) -->
			<div :class="$style.footer">
				<span :class="$style.footerStatus">
					{{ hasRunData || executionStatus === 'success' ? 'COMPLETED' : 'STANDBY' }}
				</span>
				<span :class="$style.footerTokens">
					{{ bentoCalculatedTokens }}
				</span>
			</div>
		</div>

		<CanvasNodeStatusIcons v-if="!isDisabled" :class="$style.statusIcons" />
	</div>
</template>

<style lang="scss" module>
@use './_canvasNodeStyles.scss' as styles;

.node {
	@include styles.canvas-node-border-defaults;
	--trigger-node--radius: 36px;
	--canvas-node--status-icons--margin: var(--spacing--3xs);
	--node--icon--color: var(--color--foreground--shade-1);

	position: relative;
	height: var(--canvas-node--height);
	width: var(--canvas-node--width);
	display: flex;
	align-items: center;
	justify-content: center;
	background: light-dark(
		#ffffff,
		#0f1118
	);
	@include styles.canvas-node-border;
	border-radius: 16px;
	box-shadow:
		0 4px 16px -2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.6)),
		0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.03), rgba(0, 0, 0, 0.4)),
		inset 0 1px 0 0 light-dark(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.08));
	transition:
		transform 0.18s cubic-bezier(0.16, 1, 0.3, 1),
		box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1),
		border-color 0.18s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow:
			0 12px 28px -4px light-dark(rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.7)),
			0 2px 6px 0 light-dark(rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.3)),
			0 0 0 1px light-dark(rgba(16, 185, 129, 0.3), rgba(34, 197, 94, 0.45)),
			inset 0 1px 0 0 light-dark(rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.12));
	}

	&.trigger {
		border-radius: var(--trigger-node--radius) var(--radius--lg) var(--radius--lg)
			var(--trigger-node--radius);

		&.running::after,
		&.waiting::after {
			border-radius: var(--trigger-node--radius) var(--radius--lg) var(--radius--lg)
				var(--trigger-node--radius);
		}
	}

	/**
	 * Node types
	 */

	&.configuration {
		border-radius: calc(var(--canvas-node--height) / 2);

		&.running::after,
		&.waiting::after {
			border-radius: calc(var(--canvas-node--height) / 2);
		}

		.statusIcons {
			right: unset;
		}
	}

	&.configurable {
		.icon {
			margin-left: calc(40px - (var(--node--icon--size)) / 2 - var(--canvas-node--border-width));
		}

		.description {
			top: unset;
			position: relative;
			margin-top: 0;
			margin-left: var(--spacing--sm);
			margin-right: var(--spacing--sm);
			width: auto;
			min-width: unset;
			overflow: hidden;
			text-overflow: ellipsis;
			flex-grow: 1;
			flex-shrink: 1;
		}

		.label {
			text-align: left;
		}

		.subtitle {
			text-align: left;
		}

		&.configuration {
			.icon {
				// 4px represents calc(var(--handle--indicator--width) - configuration node offset) / 2)
				margin-left: calc((var(--canvas-node--height) - var(--node--icon--size) - 4px) / 2);
			}

			.statusIcons {
				position: static;
				margin-right: var(--spacing--2xs);
			}

			.description {
				margin-right: var(--spacing--xs);
			}
		}
	}

	/**
	 * State classes
	 * The reverse order defines the priority in case multiple states are active
	 */

	&.selected {
		@include styles.canvas-node-selected-ring;
	}

	&.success {
		@include styles.status-success;
	}

	&.warning {
		@include styles.status-warning;
	}

	&.error {
		@include styles.status-error;
	}

	&.pinned {
		--canvas-node--border-width: 1.5px;
		--canvas-node--border-color: var(
			--color-canvas-node-pinned-border-color,
			var(--node--border-color--pinned)
		);
		box-shadow: 0 0 12px -2px rgba(168, 85, 247, 0.4);
	}

	&.disabled {
		--canvas-node--border-color: var(
			--color-canvas-node-disabled-border-color,
			var(--color--foreground)
		);
		opacity: 0.65;
		filter: grayscale(0.5);
	}

	&.running {
		@include styles.status-running-border;
	}

	&.waiting {
		@include styles.status-waiting-border;
	}

	&.placeholder {
		background: light-dark(rgba(240, 242, 245, 0.6), rgba(255, 255, 255, 0.04));
		backdrop-filter: blur(8px);
		border: 1.5px dashed light-dark(rgba(0, 0, 0, 0.18), rgba(255, 255, 255, 0.2));
		box-shadow: none;
		cursor: pointer;

		&:hover {
			border-color: var(--color--primary);
			box-shadow: 0 0 16px -2px rgba(99, 102, 241, 0.3);

			.icon {
				color: var(--color--primary);
			}
		}
	}
}

/* stylelint-disable */
.running::after,
.waiting::after {
	@include styles.status-animated-after;
}

.running::after {
	@include styles.status-running-animation;
}
.waiting::after {
	@include styles.status-waiting-animation;
}

@include styles.status-animation-definitions;
/* stylelint-enable */

.description {
	display: none;
}

.label,
.disabledLabel {
	font-size: var(--font-size--md);
	text-align: center;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	overflow: hidden;
	overflow-wrap: anywhere;
	font-weight: 600;
	letter-spacing: -0.01em;
	line-height: var(--line-height--sm);
	color: light-dark(var(--color--text--shade-1), #f1f5f9);
}

.subtitle {
	width: 100%;
	text-align: center;
	color: light-dark(var(--color--text--tint-1), #94a3b8);
	font-size: var(--font-size--xs);
	letter-spacing: 0.01em;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: var(--line-height--sm);
	font-weight: var(--font-weight--regular);
}

.statusIcons {
	position: absolute;
	bottom: var(--canvas-node--status-icons--margin);
	right: var(--canvas-node--status-icons--margin);
	filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
}

.icon {
	flex-grow: 0;
	flex-shrink: 0;
	filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.08));
	transition: transform 0.18s ease;

	.node:hover & {
		transform: scale(1.05);
	}
}

.bentoCard {
	position: absolute;
	top: 100%;
	left: 50%;
	transform: translateX(-50%);
	width: 256px;
	margin-top: 12px;
	background: light-dark(#ffffff, #0f1118);
	border: 1px solid light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.1));
	border-radius: 14px;
	padding: 10px 12px;
	box-shadow:
		0 8px 24px -4px light-dark(rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.6)),
		0 2px 6px 0 light-dark(rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.35));
	pointer-events: auto;
	display: flex;
	flex-direction: column;
	gap: 7px;
	z-index: 10;
	transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);

	&:hover {
		box-shadow:
			0 12px 30px -4px light-dark(rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.7)),
			0 0 0 1px light-dark(rgba(16, 185, 129, 0.25), rgba(34, 197, 94, 0.4));
	}
}

.categoryBadge {
	position: absolute;
	top: -11px;
	left: 12px;
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 2px 8px;
	border-radius: 9999px;
	font-size: 10px;
	font-weight: 700;
	letter-spacing: 0.02em;
	border: 1px solid transparent;
	box-shadow: 0 2px 6px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.3));
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
}

.dot {
	width: 5px;
	height: 5px;
	border-radius: 50%;
	display: inline-block;
}

.categoryText {
	white-space: nowrap;
	text-transform: uppercase;
	font-size: 9px;
	letter-spacing: 0.04em;
}

.metaRow {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-top: 4px;
}

.statusBadge {
	font-size: 9px;
	font-weight: 700;
	padding: 2px 6px;
	border-radius: 6px;
	letter-spacing: 0.05em;
	text-transform: uppercase;
	background: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.06));
	color: light-dark(#64748b, #94a3b8);

	&.answer,
	&.completed,
	&.evaluated {
		background: rgba(16, 185, 129, 0.12);
		color: #10b981;
	}

	&.running {
		background: rgba(59, 130, 246, 0.12);
		color: #3b82f6;
	}

	&.waiting {
		background: rgba(245, 158, 11, 0.12);
		color: #f59e0b;
	}

	&.error {
		background: rgba(239, 68, 68, 0.12);
		color: #ef4444;
	}
}

.timer {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 9.5px;
	font-weight: 600;
	color: light-dark(#64748b, #94a3b8);
	letter-spacing: 0.02em;
}

.detailsList {
	display: flex;
	flex-direction: column;
	gap: 3px;
	padding: 2px 0;
	border-top: 1px dashed light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
	border-bottom: 1px dashed light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
}

.ruleItem {
	display: flex;
	align-items: flex-start;
	gap: 5px;
	line-height: 1.35;
}

.bullet {
	font-size: 11px;
	color: light-dark(#94a3b8, #64748b);
	flex-shrink: 0;
}

.ruleText {
	font-size: 10px;
	color: light-dark(#475569, #cbd5e1);
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
}

.footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	font-size: 9px;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
}

.footerStatus {
	color: light-dark(#10b981, #34d399);
}

.footerTokens {
	color: light-dark(#64748b, #94a3b8);
	background: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.06));
	padding: 2px 6px;
	border-radius: 4px;
}
</style>
