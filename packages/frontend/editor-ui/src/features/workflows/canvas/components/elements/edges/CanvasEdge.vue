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
			<!-- Multi-stop neon energy gradient for ultra smooth laser data transfer -->
			<linearGradient id="edgeGradientLaser" x1="0%" y1="0%" x2="100%" y2="0%">
				<stop offset="0%" stop-color="#38bdf8" stop-opacity="0" />
				<stop offset="20%" stop-color="#38bdf8" stop-opacity="0.3" />
				<stop offset="50%" stop-color="#818cf8" stop-opacity="0.8" />
				<stop offset="85%" stop-color="#c084fc" stop-opacity="1" />
				<stop offset="100%" stop-color="#ffffff" stop-opacity="1" />
			</linearGradient>

			<!-- Cyan-Emerald neon beam -->
			<linearGradient id="edgeGradientCyberPulse" x1="0%" y1="0%" x2="100%" y2="0%">
				<stop offset="0%" stop-color="#10b981" stop-opacity="0" />
				<stop offset="30%" stop-color="#06b6d4" stop-opacity="0.5" />
				<stop offset="70%" stop-color="#3b82f6" stop-opacity="0.9" />
				<stop offset="95%" stop-color="#60a5fa" stop-opacity="1" />
				<stop offset="100%" stop-color="#ffffff" stop-opacity="1" />
			</linearGradient>

			<!-- Soft glow filter for light dissipation -->
			<filter id="laserGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
				<feGaussianBlur stdDeviation="3" result="blur" />
				<feMerge>
					<feMergeNode in="blur" />
					<feMergeNode in="blur" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>
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

		<!-- Smooth flowing shader-like energy stream when edge is running -->
		<template v-if="isRunning">
			<!-- Layer 1: Ambient soft aura glow -->
			<path
				v-for="segment in segments"
				:key="`flow-ambient-${segment[0]}`"
				:d="segment[0]"
				:class="$style.runningAmbientGlow"
				pathLength="100"
			/>
			<!-- Layer 2: Main streaming laser beam -->
			<path
				v-for="segment in segments"
				:key="`flow-laser-${segment[0]}`"
				:d="segment[0]"
				:class="$style.runningLaserStream"
				pathLength="100"
			/>
			<!-- Layer 3: High-speed core data pulse -->
			<path
				v-for="segment in segments"
				:key="`flow-core-${segment[0]}`"
				:d="segment[0]"
				:class="$style.runningCorePulse"
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

.runningAmbientGlow {
	fill: none;
	stroke: url(#edgeGradientCyberPulse);
	/* stylelint-disable-next-line @n8n/css-var-naming */
	stroke-width: calc(6px * var(--canvas-zoom-compensation-factor, 1));
	stroke-linecap: round;
	stroke-dasharray: 28 72;
	filter: url(#laserGlowFilter);
	opacity: 0.7;
	pointer-events: none;
	animation: flowingDataStream 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.runningLaserStream {
	fill: none;
	stroke: url(#edgeGradientLaser);
	/* stylelint-disable-next-line @n8n/css-var-naming */
	stroke-width: calc(3px * var(--canvas-zoom-compensation-factor, 1));
	stroke-linecap: round;
	stroke-dasharray: 25 75;
	filter: drop-shadow(0 0 5px #818cf8);
	pointer-events: none;
	animation: flowingDataStream 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.runningCorePulse {
	fill: none;
	stroke: #ffffff;
	/* stylelint-disable-next-line @n8n/css-var-naming */
	stroke-width: calc(1.8px * var(--canvas-zoom-compensation-factor, 1));
	stroke-linecap: round;
	stroke-dasharray: 6 94;
	filter: drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 8px #38bdf8);
	pointer-events: none;
	animation: flowingCoreData 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes flowingDataStream {
	0% {
		stroke-dashoffset: 100;
		opacity: 0;
	}
	15% {
		opacity: 0.9;
	}
	85% {
		opacity: 0.9;
	}
	100% {
		stroke-dashoffset: 0;
		opacity: 0;
	}
}

@keyframes flowingCoreData {
	0% {
		stroke-dashoffset: 100;
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
