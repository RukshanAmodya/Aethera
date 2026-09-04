<script lang="ts" setup>
import { RadioGroupItem } from 'reka-ui';

interface SegmentControlItemProps {
	label: string;
	value: string;
	disabled?: boolean;
	square?: boolean;
}

withDefaults(defineProps<SegmentControlItemProps>(), {
	disabled: false,
	square: false,
});
</script>

<template>
	<RadioGroupItem
		:value="value"
		:disabled="disabled"
		:aria-label="label"
		:class="{
			'n8n-segment-control-item': true,
			[$style.item]: true,
			[$style.square]: square,
		}"
	>
		<slot>
			{{ label }}
		</slot>
	</RadioGroupItem>
</template>

<style lang="scss" module>
@use '../../css/mixins/focus';

.item {
	position: relative;
	appearance: none;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border: none;
	flex: 1;
	border-radius: 9999px;
	background: transparent;
	height: 100%;
	padding: var(--n8n-segment-control--item-padding);
	font-size: var(--n8n-segment-control--font-size);
	font-weight: var(--font-weight--medium);
	line-height: 1;
	color: var(--text-color--subtle);
	cursor: pointer;
	user-select: none;
	white-space: nowrap;
	-webkit-font-smoothing: antialiased;
	text-rendering: optimizeLegibility;
	-webkit-tap-highlight-color: transparent;
	transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

	&:focus {
		outline: none;
	}

	@include focus.focus-visible-ring-offset;

	&:focus-visible {
		z-index: 1;
	}

	&[data-state='checked'] {
		color: var(--text-color);
		background-color: var(--color--foreground--tint-2);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
	}

	&[data-state='checked'][data-disabled] {
		background-color: var(--background--disabled);
	}

	&[data-disabled] {
		cursor: not-allowed;
		color: var(--text-color--disabled);
	}
}

@media (hover: hover) {
	.item:hover:not([data-state='checked']):not([data-disabled]) {
		color: var(--text-color);
		background-color: var(--color--foreground--tint-1);
	}

	// Progressive enhancement: clear sticky hover while keyboard-navigating.
	// [role='radiogroup'] is an attribute selector, so CSS modules leave it unhashed.
	[role='radiogroup']:has(:focus-visible) .item:hover:not([data-state='checked']) {
		color: var(--text-color--subtle);
		background-color: transparent;
	}
}

.square {
	aspect-ratio: 1/1;
	padding: 0;
}
</style>
