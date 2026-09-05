<script lang="ts" setup>
/* eslint-disable vue/no-multiple-template-root */
import type { CanvasConnectionData } from '../../../canvas.types';
import { isValidNodeConnectionType } from '@/app/utils/typeGuards';
import type { Connection, EdgeProps } from '@vue-flow/core';
import { BaseEdge, EdgeLabelRenderer } from '@vue-flow/core';
import { NodeConnectionTypes } from 'n8n-workflow';
import { computed, ref, toRef, useCssModule, watch } from 'vue';
import CanvasEdgeToolbar from './CanvasEdgeToolbar.vue';
import { getEdgeRenderData } from './utils';
import { useCanvas } from '../../../composables/useCanvas';
import { useZoomAdjustedValues } from '../../../composables/useZoomAdjustedValues';
import { resolveCanonicalConnection } from '../../../canvas.utils';

const emit = defineEmits<{
	add: [connection: Connection];
	delete: [connection: Connection];
	'update:label:hovered': [hovered: boolean];
}>();

export type CanvasEdgeProps = EdgeProps<CanvasConnectionData> & {
	readOnly?: boolean;
	hovered?: boolean;
	bringToFront?: boolean; // Determines if entire edges layer should be brought to front
};

const props = defineProps<CanvasEdgeProps>();

const data = toRef(props, 'data');

const $style = useCssModule();

const { viewport } = useCanvas();
const { calculateEdgeLightness } = useZoomAdjustedValues(viewport);

const connectionType = computed(() =>
	isValidNodeConnectionType(props.data.source.type)
		? props.data.source.type
		: NodeConnectionTypes.Main,
);

const delayedHovered = ref(props.hovered);
const delayedHoveredSetTimeoutRef = ref<NodeJS.Timeout | null>(null);
const delayedHoveredTimeout = 600;

watch(
	() => props.hovered,
	(isHovered) => {
		if (isHovered) {
			if (delayedHoveredSetTimeoutRef.value) clearTimeout(delayedHoveredSetTimeoutRef.value);
			delayedHovered.value = true;
		} else {
			delayedHoveredSetTimeoutRef.value = setTimeout(() => {
				delayedHovered.value = false;
			}, delayedHoveredTimeout);
		}
	},
	{ immediate: true },
);

const renderToolbar = computed(() => delayedHovered.value && !props.readOnly);

const isMainConnection = computed(() => data.value.source.type === NodeConnectionTypes.Main);

const status = computed(() => props.data.status);
const isRunning = computed(() => status.value === 'running');

const edgeStyle = computed(() => ({
	...props.style,
	...(isMainConnection.value ? {} : { strokeDasharray: '5,6' }),
}));

const edgeClasses = computed(() => ({
	[$style.edge]: true,
	hovered: delayedHovered.value,
	'bring-to-front': props.bringToFront,
}));

const edgeToolbarStyle = computed(() => ({
	transform: `translate(-50%, -50%) translate(${labelPosition.value[0]}px, ${labelPosition.value[1]}px)`,
	...(delayedHovered.value && props.bringToFront ? { zIndex: 1 } : {}),
}));

const edgeToolbarClasses = computed(() => ({
	[$style.edgeLabelWrapper]: true,
	'vue-flow__edge-label': true,
	selected: props.selected,
	[$style.straight]: renderData.value.isConnectorStraight,
}));

const renderData = computed(() =>
	getEdgeRenderData(props, {
		connectionType: connectionType.value,
	}),
);

const segments = computed(() => renderData.value.segments);

const labelPosition = computed(() => renderData.value.labelPosition);

const connection = computed<Connection>(() =>
	resolveCanonicalConnection({
		source: props.source,
		target: props.target,
		sourceHandle: props.sourceHandleId,
		targetHandle: props.targetHandleId,
		data: props.data,
	}),
);

const edgeColor = computed(() => {
	if (status.value === 'success') {
		return 'var(--color--success)';
	} else if (status.value === 'pinned') {
		return 'var(--color--secondary)';
	}
	return undefined;
});

// For colored edges (success/pinned), don't apply hover effect
const hasColoredStatus = computed(() => status.value === 'success' || status.value === 'pinned');
const hoveredForLightness = computed(() => (hasColoredStatus.value ? false : delayedHovered.value));

const edgeLightness = calculateEdgeLightness(hoveredForLightness);

const edgeStyles = computed(() => {
	const styles: Record<string, string> = {
		'--canvas-edge--color--lightness--light': edgeLightness.value.light,
		'--canvas-edge--color--lightness--dark': edgeLightness.value.dark,
	};
	if (edgeColor.value) {
		styles['--canvas-edge--color'] = edgeColor.value;
	}
	return styles;
});

function onAdd() {
	emit('add', connection.value);
}

function onDelete() {
	emit('delete', connection.value);
}

function onEdgeLabelMouseEnter() {
	emit('update:label:hovered', true);
}

function onEdgeLabelMouseLeave() {
	emit('update:label:hovered', false);
}
</script>

<template>
	<g
		data-test-id="edge"
		:data-source-node-name="data.source?.node"
		:data-target-node-name="data.target?.node"
		:style="edgeStyles"
		v-bind="$attrs"
	>
		<defs>
			<!-- Top / Coral Flow Gradient -->
			<linearGradient id="edgeGradientCoral" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="#ff4d6d" stop-opacity="1" />
				<stop offset="60%" stop-color="#ff758f" stop-opacity="0.8" />
				<stop offset="100%" stop-color="#ffa8b6" stop-opacity="0.2" />
			</linearGradient>

			<!-- Emerald / Green Flow Gradient -->
			<linearGradient id="edgeGradientGreen" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="#22c55e" stop-opacity="1" />
				<stop offset="60%" stop-color="#4ade80" stop-opacity="0.8" />
				<stop offset="100%" stop-color="#86efac" stop-opacity="0.2" />
			</linearGradient>

			<!-- Violet / Indigo Flow Gradient -->
			<linearGradient id="edgeGradientViolet" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="#6366f1" stop-opacity="1" />
				<stop offset="60%" stop-color="#818cf8" stop-opacity="0.8" />
				<stop offset="100%" stop-color="#c7d2fe" stop-opacity="0.2" />
			</linearGradient>
		</defs>

		<slot name="highlight" v-bind="{ segments }" />

		<BaseEdge
			v-for="(segment, index) in segments"
			:id="`${id}-${index}`"
			:key="segment[0]"
			:class="edgeClasses"
			:style="edgeStyle"
			:path="segment[0]"
			:marker-end="isMainConnection ? markerEnd : undefined"
			:interaction-width="40"
		/>

		<!-- Smooth flowing gradient energy beam when edge is running -->
		<template v-if="isRunning">
			<path
				v-for="segment in segments"
				:key="`flow-glow-${segment[0]}`"
				:d="segment[0]"
				:class="$style.runningFlowGlow"
				pathLength="100"
			/>
			<path
				v-for="segment in segments"
				:key="`flow-${segment[0]}`"
				:d="segment[0]"
				:class="$style.runningFlow"
				pathLength="100"
			/>
		</template>
	</g>

	<EdgeLabelRenderer v-if="renderToolbar">
		<div
			data-test-id="edge-label"
			:data-source-node-name="data.source?.node"
			:data-target-node-name="data.target?.node"
			:data-edge-status="status"
			:style="edgeToolbarStyle"
			:class="edgeToolbarClasses"
			@mouseenter="onEdgeLabelMouseEnter"
			@mouseleave="onEdgeLabelMouseLeave"
		>
			<CanvasEdgeToolbar
				:type="connectionType"
				:target-node="targetNode"
				:source-node="sourceNode"
				@add="onAdd"
				@delete="onDelete"
			/>
		</div>
	</EdgeLabelRenderer>
</template>

<style lang="scss" module>
.edge {
	transition: fill 0.3s ease;
	// @bugfix cat-1639-connection-colors-not-rendering-correctly
	// Using !important here to override BaseEdge styles after Rolldown Vite migration
	stroke: var(
		--canvas-edge--color,
		light-dark(
			oklch(var(--canvas-edge--color--lightness--light) 0 0),
			#252830
		)
	) !important;
	/* stylelint-disable-next-line @n8n/css-var-naming */
	stroke-width: calc(2.2px * var(--canvas-zoom-compensation-factor, 1)) !important;
	stroke-linecap: round;
}

.runningFlowGlow {
	fill: none;
	stroke: url(#edgeGradientGreen);
	/* stylelint-disable-next-line @n8n/css-var-naming */
	stroke-width: calc(4px * var(--canvas-zoom-compensation-factor, 1));
	stroke-linecap: round;
	stroke-dasharray: 35 100;
	filter: drop-shadow(0 0 6px #22c55e);
	opacity: 0.6;
	pointer-events: none;
	animation: flowingBeam 1.8s linear infinite;
}

.runningFlow {
	fill: none;
	stroke: url(#edgeGradientGreen);
	/* stylelint-disable-next-line @n8n/css-var-naming */
	stroke-width: calc(2.5px * var(--canvas-zoom-compensation-factor, 1));
	stroke-linecap: round;
	stroke-dasharray: 35 100;
	filter: drop-shadow(0 0 4px #22c55e);
	pointer-events: none;
	animation: flowingBeam 1.8s linear infinite;
}

@keyframes flowingBeam {
	0% {
		stroke-dashoffset: 135;
		opacity: 0;
	}
	20% {
		opacity: 1;
	}
	80% {
		opacity: 1;
	}
	100% {
		stroke-dashoffset: 0;
		opacity: 0;
	}
}

.edgeLabelWrapper {
	transform: translateY(calc(var(--spacing--xs) * -1));
	position: absolute;

	/* stylelint-disable-next-line @n8n/css-var-naming */
	--label-translate-y: 0;

	&.straight {
		/* stylelint-disable-next-line @n8n/css-var-naming */
		--label-translate-y: -100%;
	}
}

.edgeLabelContainer {
	/* stylelint-disable-next-line @n8n/css-var-naming */
	transform: scale(var(--canvas-zoom-compensation-factor, 1)) translate(0, var(--label-translate-y));
	display: inline-flex;
	align-items: center;
	gap: 5px;
}

.edgeLabelIf {
	font-size: 11px;
	color: #9ca3af;
	background: #1a1c22;
	border: 1px solid rgba(255, 255, 255, 0.08);
	border-radius: 9999px;
	padding: 2px 8px;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.edgeLabel {
	font-size: 11px;
	font-weight: 500;
	color: #9ca3af;
	background: #1a1c22;
	border: 1px solid rgba(255, 255, 255, 0.08);
	border-radius: 9999px;
	padding: 2px 10px;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);

	&.trueBranch {
		color: #4ade80;
		background: #0c2617;
		border-color: rgba(34, 197, 94, 0.3);
	}

	&.falseBranch {
		color: #f87171;
		background: #2a1318;
		border-color: rgba(255, 77, 109, 0.3);
	}
}
</style>
