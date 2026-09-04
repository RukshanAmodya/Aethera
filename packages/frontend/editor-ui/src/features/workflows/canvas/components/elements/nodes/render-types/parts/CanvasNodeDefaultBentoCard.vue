<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
	label: string;
	subtitle?: string;
	nodeType?: string;
	isTrigger?: boolean;
	isDisabled?: boolean;
	executionStatus?: string;
	hasRunData?: boolean;
	runDataIterations?: number;
	tokenCount?: number;
	duration?: string;
}>();

interface CategoryInfo {
	label: string;
	color: string;
	bg: string;
	border: string;
}

const category = computed<CategoryInfo>(() => {
	const type = (props.nodeType || '').toLowerCase();
	const name = (props.label || '').toLowerCase();

	if (
		props.isTrigger ||
		type.includes('trigger') ||
		type.includes('webhook') ||
		name.includes('source') ||
		name.includes('user query') ||
		name.includes('input')
	) {
		return {
			label: 'Input Source',
			color: '#10b981',
			bg: 'rgba(16, 185, 129, 0.12)',
			border: 'rgba(16, 185, 129, 0.28)',
		};
	}

	if (
		type.includes('switch') ||
		type.includes('if') ||
		type.includes('router') ||
		type.includes('code') ||
		type.includes('function') ||
		type.includes('subworkflow') ||
		name.includes('router') ||
		name.includes('intent')
	) {
		return {
			label: 'System Worker',
			color: '#f59e0b',
			bg: 'rgba(245, 158, 11, 0.12)',
			border: 'rgba(245, 158, 11, 0.28)',
		};
	}

	if (
		type.includes('openai') ||
		type.includes('anthropic') ||
		type.includes('claude') ||
		type.includes('llm') ||
		type.includes('agent') ||
		type.includes('chain') ||
		type.includes('model') ||
		name.includes('claude') ||
		name.includes('gpt') ||
		name.includes('ai')
	) {
		return {
			label: 'AI Worker',
			color: '#3b82f6',
			bg: 'rgba(59, 130, 246, 0.12)',
			border: 'rgba(59, 130, 246, 0.28)',
		};
	}

	if (
		type.includes('eval') ||
		type.includes('assert') ||
		type.includes('filter') ||
		type.includes('validate') ||
		name.includes('eval') ||
		name.includes('score') ||
		name.includes('check')
	) {
		return {
			label: 'Evaluation Worker',
			color: '#ec4899',
			bg: 'rgba(236, 72, 153, 0.12)',
			border: 'rgba(236, 72, 153, 0.28)',
		};
	}

	if (
		type.includes('memory') ||
		type.includes('redis') ||
		type.includes('cache') ||
		type.includes('buffer') ||
		type.includes('window') ||
		name.includes('memory') ||
		name.includes('context')
	) {
		return {
			label: 'Memory Layer',
			color: '#8b5cf6',
			bg: 'rgba(139, 92, 246, 0.12)',
			border: 'rgba(139, 92, 246, 0.28)',
		};
	}

	return {
		label: 'System Worker',
		color: '#6366f1',
		bg: 'rgba(99, 102, 241, 0.12)',
		border: 'rgba(99, 102, 241, 0.28)',
	};
});

const statusLabel = computed(() => {
	if (props.isDisabled) return 'DISABLED';
	if (props.executionStatus === 'running') return 'RUNNING';
	if (props.executionStatus === 'waiting') return 'WAITING';
	if (props.executionStatus === 'error') return 'ERROR';
	if (props.hasRunData || props.executionStatus === 'success') {
		if (category.value.label === 'Input Source') return 'ANSWER';
		if (category.value.label === 'Evaluation Worker') return 'EVALUATED';
		return 'COMPLETED';
	}
	return 'IDLE';
});

const timingText = computed(() => {
	if (props.duration) return props.duration;
	if (props.hasRunData || props.executionStatus === 'success') return '0.1 SEC';
	return 'READY';
});

const calculatedTokens = computed(() => {
	if (props.tokenCount !== undefined && props.tokenCount > 0) {
		return `${props.tokenCount} TOKEN`;
	}
	if (props.runDataIterations && props.runDataIterations > 1) {
		return `${props.runDataIterations} RUNS`;
	}
	if (category.value.label === 'AI Worker') return '213 TOKEN';
	if (category.value.label === 'Evaluation Worker') return '48 TOKEN';
	if (category.value.label === 'Input Source') return 'INPUT READY';
	if (props.hasRunData) return '1 ITEM';
	return '0 TOKEN';
});

const bulletDetails = computed(() => {
	const name = (props.label || '').toLowerCase();
	if (name.includes('intent') || name.includes('router')) {
		return ['Categorizes incoming prompt', 'Routes to specialized sub-agents'];
	}
	if (name.includes('claude') || name.includes('gpt') || category.value.label === 'AI Worker') {
		return ['Contextual reasoning model', 'High-fidelity analytical synthesis'];
	}
	if (name.includes('eval') || category.value.label === 'Evaluation Worker') {
		return ['Coherence & safety verification', 'Confidence threshold scoring'];
	}
	if (name.includes('memory') || category.value.label === 'Memory Layer') {
		return ['Stores multi-turn conversational state', 'Low-latency key-value retrieval'];
	}
	if (props.subtitle) {
		return [props.subtitle];
	}
	return ['Executes standard pipeline task', 'Provides structured payload output'];
});
</script>

<template>
	<div :class="$style.bentoCard">
		<!-- Top Floating Category Badge -->
		<div
			:class="$style.categoryBadge"
			:style="{
				color: category.color,
				backgroundColor: category.bg,
				borderColor: category.border,
			}"
		>
			<span :class="$style.dot" :style="{ backgroundColor: category.color }" />
			<span :class="$style.categoryText">{{ category.label }}</span>
		</div>

		<!-- Status & Execution Time Row -->
		<div :class="$style.metaRow">
			<div :class="[$style.statusBadge, $style[statusLabel.toLowerCase()]]">
				{{ statusLabel }}
			</div>
			<div :class="$style.timer">
				<svg
					width="10"
					height="10"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="12" cy="12" r="10" />
					<polyline points="12 6 12 12 16 14" />
				</svg>
				<span>{{ timingText }}</span>
			</div>
		</div>

		<!-- Bento Dynamic Bullet Details / Context Rule Texts -->
		<div :class="$style.detailsList">
			<div v-for="(rule, idx) in bulletDetails" :key="idx" :class="$style.ruleItem">
				<span :class="$style.bullet">•</span>
				<span :class="$style.ruleText">{{ rule }}</span>
			</div>
		</div>

		<!-- Card Footer (Status and Token/Run Counter) -->
		<div :class="$style.footer">
			<span :class="$style.footerStatus">
				{{ hasRunData || executionStatus === 'success' ? 'COMPLETED' : 'STANDBY' }}
			</span>
			<span :class="$style.footerTokens">
				{{ calculatedTokens }}
			</span>
		</div>
	</div>
</template>

<style lang="scss" module>
.bentoCard {
	position: absolute;
	top: 100%;
	left: 50%;
	transform: translateX(-50%);
	width: 256px;
	margin-top: 12px;
	background: light-dark(#ffffff, #141620);
	border: 1px solid light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.1));
	border-radius: 14px;
	padding: 10px 12px;
	box-shadow:
		0 8px 24px -4px light-dark(rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.45)),
		0 2px 6px 0 light-dark(rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.25));
	pointer-events: auto;
	display: flex;
	flex-direction: column;
	gap: 7px;
	z-index: 10;
	transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);

	&:hover {
		box-shadow:
			0 12px 30px -4px light-dark(rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.55)),
			0 0 0 1px light-dark(rgba(99, 102, 241, 0.25), rgba(129, 140, 248, 0.35));
	}
}

.categoryBadge {
	position: absolute;
	top: -11px;
	left: 12px;
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 2px 8px;
	border-radius: 9999px;
	font-size: 10px;
	font-weight: 700;
	letter-spacing: 0.02em;
	border: 1px solid transparent;
	box-shadow: 0 2px 6px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.3));
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
}

.dot {
	width: 5px;
	height: 5px;
	border-radius: 50%;
	display: inline-block;
}

.categoryText {
	white-space: nowrap;
	text-transform: uppercase;
	font-size: 9px;
	letter-spacing: 0.04em;
}

.metaRow {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-top: 4px;
}

.statusBadge {
	font-size: 9px;
	font-weight: 700;
	padding: 2px 6px;
	border-radius: 6px;
	letter-spacing: 0.05em;
	text-transform: uppercase;
	background: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.06));
	color: light-dark(#64748b, #94a3b8);

	&.answer,
	&.completed,
	&.evaluated {
		background: rgba(16, 185, 129, 0.12);
		color: #10b981;
	}

	&.running {
		background: rgba(59, 130, 246, 0.12);
		color: #3b82f6;
	}

	&.waiting {
		background: rgba(245, 158, 11, 0.12);
		color: #f59e0b;
	}

	&.error {
		background: rgba(239, 68, 68, 0.12);
		color: #ef4444;
	}
}

.timer {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 9.5px;
	font-weight: 600;
	color: light-dark(#64748b, #94a3b8);
	letter-spacing: 0.02em;
}

.detailsList {
	display: flex;
	flex-direction: column;
	gap: 3px;
	padding: 2px 0;
	border-top: 1px dashed light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
	border-bottom: 1px dashed light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
}

.ruleItem {
	display: flex;
	align-items: flex-start;
	gap: 5px;
	line-height: 1.35;
}

.bullet {
	font-size: 11px;
	color: light-dark(#94a3b8, #64748b);
	flex-shrink: 0;
}

.ruleText {
	font-size: 10px;
	color: light-dark(#475569, #cbd5e1);
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
}

.footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	font-size: 9px;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
}

.footerStatus {
	color: light-dark(#10b981, #34d399);
}

.footerTokens {
	color: light-dark(#64748b, #94a3b8);
	background: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.06));
	padding: 2px 6px;
	border-radius: 4px;
}
</style>
