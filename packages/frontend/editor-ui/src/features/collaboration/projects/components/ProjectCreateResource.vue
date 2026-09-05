<script lang="ts" setup>
import type { ButtonVariant, UserAction } from '@n8n/design-system';
import type { IUser } from 'n8n-workflow';
import { useTemplateRef } from 'vue';

import { N8nActionToggle, N8nIconButton } from '@n8n/design-system';

defineProps<{
	actions: Array<UserAction<IUser>>;
	disabled?: boolean;
	variant?: ButtonVariant;
}>();

const emit = defineEmits<{
	action: [id: string];
}>();

const actionToggleRef = useTemplateRef('actionToggleRef');

defineExpose({
	openActionToggle: (isOpen: boolean) => actionToggleRef.value?.openActionToggle(isOpen),
});
</script>

<template>
	<div :class="[$style.buttonGroup]">
		<slot></slot>
		<N8nActionToggle
			ref="actionToggleRef"
			data-test-id="add-resource"
			:actions="actions"
			placement="bottom-end"
			:teleported="false"
			@action="emit('action', $event)"
		>
			<N8nIconButton
				:disabled="disabled"
				:class="[$style.buttonGroupDropdown]"
				icon="chevron-down"
				:variant="variant ?? 'solid'"
			/>
		</N8nActionToggle>
	</div>
</template>

<style lang="scss" module>
.buttonGroup {
	display: inline-flex;
	border-radius: 9999px;
	overflow: hidden;
	box-shadow: 0 4px 14px -2px rgba(255, 109, 90, 0.35);

	:global(> .button) {
		background: #ff6d5a !important;
		border-color: #ff6d5a !important;
		color: #ffffff !important;
		font-weight: 600;

		&:hover {
			background: #e85642 !important;
			border-color: #e85642 !important;
		}

		&:not(:first-child) {
			border-radius: 0;
		}

		&:first-child {
			border-radius: 9999px 0 0 9999px !important;
			padding-left: 18px;
			padding-right: 14px;
		}
	}
}

.buttonGroupDropdown {
	border-left: 1px solid rgba(255, 255, 255, 0.25) !important;
	border-radius: 0 9999px 9999px 0 !important;
	background: #ff6d5a !important;
	border-color: #ff6d5a !important;
	color: #ffffff !important;

	&:hover {
		background: #e85642 !important;
		border-color: #e85642 !important;
	}
}
</style>
