<script lang="ts" setup>
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		handleClasses?: string;
	}>(),
	{
		handleClasses: undefined,
	},
);

const isOutputHandle = computed(() => props.handleClasses === 'source');
</script>

<template>
	<div :class="[$style.wrapper, { [$style.output]: isOutputHandle, [$style.input]: !isOutputHandle }]">
		<div :class="$style.halo" />
		<div :class="[$style.dot, handleClasses]" />
	</div>
</template>

<style lang="scss" module>
.wrapper {
	position: relative;
	padding: 4px;
	margin: -4px;
	z-index: 2;
	display: flex;
	align-items: center;
	justify-content: center;

	&.output {
		cursor: crosshair;
	}
}

.halo {
	position: absolute;
	width: 24px;
	height: 16px;
	border-radius: 9999px;
	background: #22c55e;
	filter: blur(6px);
	opacity: 0.4;
	pointer-events: none;
	transition: opacity 0.2s ease;

	.input & {
		background: #ff4d6d;
		opacity: 0.35;
	}
}

.dot {
	width: 14px;
	height: 14px;
	border-radius: 50%;
	background: #141518;
	border: 2px solid #22c55e;
	box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
	position: relative;
	z-index: 1;
	transition:
		transform 0.18s cubic-bezier(0.16, 1, 0.3, 1),
		background 0.18s ease,
		border-color 0.18s ease,
		box-shadow 0.18s ease;

	.input & {
		border-color: #ff4d6d;
		box-shadow: 0 0 8px rgba(255, 77, 109, 0.5);
	}

	.wrapper.output:hover & {
		border-color: #4ade80;
		box-shadow: 0 0 12px #22c55e;
		transform: scale(1.3);
	}
}
</style>
