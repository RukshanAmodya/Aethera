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
	<div :class="[$style.wrapper, { [$style.output]: isOutputHandle }]">
		<div :class="[$style.dot, handleClasses]" />
	</div>
</template>

<style lang="scss" module>
.wrapper {
	position: relative;
	padding: 4px;
	margin: -4px;
	z-index: 2;

	&.output {
		cursor: crosshair;
	}
}

.dot {
	width: var(--handle--indicator--width);
	height: var(--handle--indicator--height);
	border-radius: 50%;
	background: light-dark(#fff, #0d1117);
	border: 1.5px solid
		light-dark(
			oklch(var(--handle--border--lightness--light, 0.68) 0 0),
			#22c55e
		);
	box-shadow: 0 0 6px rgba(34, 197, 94, 0.45);
	transition:
		transform 0.18s cubic-bezier(0.16, 1, 0.3, 1),
		background 0.18s ease,
		border-color 0.18s ease,
		box-shadow 0.18s ease;

	.wrapper.output:hover & {
		border: 1.5px solid #34d399;
		background: light-dark(#f8fafc, #10b981);
		box-shadow: 0 0 12px rgba(34, 197, 94, 0.85);
		transform: scale(1.4);
	}
}
</style>
