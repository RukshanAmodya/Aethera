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
	background: light-dark(#fff, #1e2433);
	border: 1.5px solid
		light-dark(
			oklch(var(--handle--border--lightness--light, 0.68) 0 0),
			oklch(var(--handle--border--lightness--dark, 0.5) 0 0)
		);
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
	transition:
		transform 0.18s cubic-bezier(0.16, 1, 0.3, 1),
		background 0.18s ease,
		border-color 0.18s ease,
		box-shadow 0.18s ease;

	.wrapper.output:hover & {
		border: 1.5px solid #6366f1;
		background: light-dark(#f8fafc, #2b3245);
		box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
		transform: scale(1.4);
	}
}
</style>
