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

const footerStatus = computed(() => {
	if (isDisabled.value) return { text: 'Disabled', type: 'disabled' };
	if (executionStatus.value === 'running') return { text: 'Running', type: 'running' };
	if (executionStatus.value === 'waiting') return { text: 'Waiting', type: 'waiting' };
	if (executionStatus.value === 'error') return { text: 'Error', type: 'error' };
	if (hasRunData.value || executionStatus.value === 'success') {
		return { text: 'Connected', type: 'connected' };
	}
	return { text: 'Ready', type: 'ready' };
});

const footerLeftInfo = computed(() => {
	if (runDataIterations.value && runDataIterations.value > 1) {
		return `${runDataIterations.value} runs`;
	}
	if (hasRunData.value) {
		return '1 item';
	}
	if (renderOptions.value.trigger) {
		return 'Trigger event';
	}
	return 'Output ready';
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
		<CanvasNodeSettingsIcons
			v-if="
				!renderOptions.configuration &&
				!isDisabled &&
				!(hasSubstitutedOutput && !nodeHelpers.isProductionExecutionPreview.value)
			"
		/>
		<CanvasNodeDisabledStrikeThrough v-if="isStrikethroughVisible" />

		<!-- Card Content: Header (Icon Box + Titles) -->
		<div :class="$style.header">
			<div :class="$style.iconBox">
				<NodeIcon
					:icon-source="iconSource"
					:size="22"
					:shrink="false"
					:disabled="isDisabled"
					:class="$style.icon"
				/>
			</div>
			<div :class="$style.titleWrapper">
				<h2 v-if="label" :class="$style.label" :title="label">
					{{ label }}
				</h2>
				<span v-if="subtitle" :class="$style.subtitle" :title="subtitle">
					{{ subtitle }}
				</span>
				<span v-else-if="isDisabled" :class="$style.disabledText">
					({{ i18n.baseText('node.disabled') }})
				</span>
			</div>
		</div>

		<!-- Card Content: Footer (Left Meta + Right Connected Status) -->
		<div :class="$style.footer">
			<div :class="$style.footerLeft">
				<div :class="$style.avatarStack">
					<span :class="[$style.avatar, $style.avatar1]">⚡</span>
					<span :class="[$style.avatar, $style.avatar2]">🤖</span>
					<span :class="[$style.avatar, $style.avatar3]">📊</span>
				</div>
				<span :class="$style.footerLeftText">{{ footerLeftInfo }}</span>
			</div>

			<div :class="[$style.statusBadge, $style[footerStatus.type]]">
				<span :class="$style.statusDot" />
				<span>{{ footerStatus.text }}</span>
			</div>
		</div>

		<CanvasNodeStatusIcons v-if="!isDisabled" :class="$style.statusIcons" />
	</div>
</template>

<style lang="scss" module>
@use './_canvasNodeStyles.scss' as styles;

.node {
	@include styles.canvas-node-border-defaults;
	--trigger-node--radius: 22px;
	--canvas-node--status-icons--margin: var(--spacing--3xs);
	--node--icon--color: var(--color--foreground--shade-1);

	position: relative;
	height: var(--canvas-node--height, 128px);
	width: var(--canvas-node--width, 288px);
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	padding: 14px 16px;
	background: #141518;
	border: 1px solid #2a2c33;
	border-radius: 22px;
	box-shadow: 0 16px 32px -4px rgba(0, 0, 0, 0.6), 0 4px 8px -2px rgba(0, 0, 0, 0.4);
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
	transition:
		transform 0.18s cubic-bezier(0.16, 1, 0.3, 1),
		box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1),
		border-color 0.18s ease;

	&:hover {
		transform: translateY(-2px);
		border-color: #3f424e;
		box-shadow: 0 20px 36px -4px rgba(0, 0, 0, 0.7), 0 6px 12px -2px rgba(0, 0, 0, 0.5);
	}

	&.selected {
		border-color: #ff4d6d;
		box-shadow: 0 0 0 2px #ff4d6d, 0 16px 32px -4px rgba(255, 77, 109, 0.25);
	}

	&.running {
		border-color: #6366f1;
		box-shadow: 0 0 16px -2px rgba(99, 102, 241, 0.45);
	}

	&.error {
		border-color: #ff4d6d;
		box-shadow: 0 0 14px -2px rgba(255, 77, 109, 0.35);
	}

	&.disabled {
		opacity: 0.6;
		filter: grayscale(0.5);
	}
}

.header {
	display: flex;
	align-items: center;
	gap: 12px;
	min-width: 0;
}

.iconBox {
	width: 44px;
	height: 44px;
	border-radius: 12px;
	background: #202228;
	border: 1px solid rgba(255, 255, 255, 0.06);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	color: #fff;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.titleWrapper {
	display: flex;
	flex-direction: column;
	min-width: 0;
	flex: 1;
	overflow: hidden;
}

.label {
	font-size: 15px;
	font-weight: 500;
	letter-spacing: -0.01em;
	line-height: 1.25;
	color: #ffffff;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	margin: 0;
}

.subtitle,
.disabledText {
	font-size: 12px;
	color: #717682;
	font-weight: 400;
	margin-top: 2px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.disabledText {
	color: #f87171;
}

.footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-top: 6px;
}

.footerLeft {
	display: flex;
	align-items: center;
	gap: 6px;
}

.avatarStack {
	display: flex;
	align-items: center;
	margin-left: 2px;
}

.avatar {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	border-radius: 50%;
	font-size: 10px;
	border: 1.5px solid #141518;
	margin-left: -6px;

	&:first-child {
		margin-left: 0;
	}
}

.avatar1 {
	background: #f97316;
}

.avatar2 {
	background: #06b6d4;
}

.avatar3 {
	background: #ec4899;
}

.footerLeftText {
	font-size: 11px;
	color: #8c93a0;
	font-weight: 500;
}

.statusBadge {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 3px 10px;
	border-radius: 9999px;
	font-size: 11px;
	font-weight: 500;
	letter-spacing: 0.01em;

	&.connected,
	&.success {
		background: #0d2617;
		border: 1px solid rgba(22, 78, 41, 0.6);
		color: #22c55e;

		.statusDot {
			background: #22c55e;
			box-shadow: 0 0 6px #22c55e;
		}
	}

	&.running {
		background: #141f38;
		border: 1px solid rgba(30, 58, 138, 0.6);
		color: #60a5fa;

		.statusDot {
			background: #60a5fa;
			box-shadow: 0 0 6px #60a5fa;
		}
	}

	&.waiting,
	&.ready {
		background: #1a1d24;
		border: 1px solid rgba(255, 255, 255, 0.08);
		color: #9ca3af;

		.statusDot {
			background: #9ca3af;
		}
	}

	&.error {
		background: #2a1318;
		border: 1px solid rgba(255, 77, 109, 0.3);
		color: #f87171;

		.statusDot {
			background: #ff4d6d;
			box-shadow: 0 0 6px #ff4d6d;
		}
	}

	&.disabled {
		background: #181a20;
		border: 1px solid rgba(255, 255, 255, 0.05);
		color: #6b7280;

		.statusDot {
			background: #6b7280;
		}
	}
}

.statusDot {
	width: 5px;
	height: 5px;
	border-radius: 50%;
	display: inline-block;
}

.statusIcons {
	position: absolute;
	top: -6px;
	right: -6px;
	z-index: 10;
}

.icon {
	flex-grow: 0;
	flex-shrink: 0;
	transition: transform 0.18s ease;

	.node:hover & {
		transform: scale(1.05);
	}
}
</style>
