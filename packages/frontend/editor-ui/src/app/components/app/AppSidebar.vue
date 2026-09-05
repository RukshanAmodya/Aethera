<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import MainSidebar from '@/app/components/MainSidebar.vue';
import CanvasSidebar from '@/app/components/CanvasSidebar.vue';

const route = useRoute();

// When viewing a workflow canvas or executions debug/nodeview, render the compact CanvasSidebar
const isWorkflowView = computed(() => {
	return Boolean(
		route.meta.nodeView ||
		route.meta.keepWorkflowAlive ||
		route.meta.layout === 'workflow' ||
		route.params.name ||
		route.params.workflowId,
	);
});
</script>

<template>
	<CanvasSidebar v-if="isWorkflowView" />
	<MainSidebar v-else />
</template>
