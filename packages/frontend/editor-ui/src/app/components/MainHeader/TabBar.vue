<script lang="ts" setup>
import { MAIN_HEADER_TABS } from '@/app/constants';
import type { ITabBarItem } from '@/Interface';

import { N8nSegmentControl } from '@n8n/design-system';
withDefaults(
	defineProps<{
		items: ITabBarItem[];
		modelValue?: string;
		floating?: boolean;
	}>(),
	{
		modelValue: MAIN_HEADER_TABS.WORKFLOW,
		floating: false,
	},
);

const emit = defineEmits<{
	'update:modelValue': [tab: MAIN_HEADER_TABS, event: MouseEvent];
}>();

function onUpdateModelValue(tab: string, event: MouseEvent): void {
	emit('update:modelValue', tab as MAIN_HEADER_TABS, event);
}
</script>

<template>
	<div
		v-if="items"
		:class="{
			[$style.container]: true,
			[$style.floating]: floating,
			['tab-bar-container']: true,
		}"
	>
		<N8nSegmentControl
			:model-value="modelValue"
			:options="items"
			@update:model-value="onUpdateModelValue"
		/>
	</div>
</template>

<style module lang="scss">
.container {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 50;
	pointer-events: auto;
}

.floating {
	top: var(--spacing--xs);
	transform: translateX(-50%);
}

@media screen and (max-width: 430px) {
	.container {
		display: none;
	}
}
</style>

