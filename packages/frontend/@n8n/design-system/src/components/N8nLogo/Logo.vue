<script setup lang="ts">
import { useFavicon } from '@vueuse/core';
import { computed, onMounted, useCssModule, useTemplateRef } from 'vue';

import LogoIcon from './logo-icon.svg';
import LogoText from './logo-text.svg';
import aetheraLogo from './aethera-logo.png';

const props = defineProps<
	(
		| {
				size: 'large';
		  }
		| {
				size: 'small';
				collapsed: boolean;
		  }
	) & {
		releaseChannel?: 'stable' | 'beta' | 'nightly' | 'dev' | 'rc';
	}
>();

const { size, releaseChannel } = props;

const showLogoText = computed(() => {
	if (size === 'large') return true;
	return !props.collapsed;
});

const $style = useCssModule();
const containerClasses = computed(() => {
	if (size === 'large') {
		return [$style.logoContainer, $style.large];
	}
	return [
		$style.logoContainer,
		$style.sidebar,
		props.collapsed ? $style.sidebarCollapsed : $style.sidebarExpanded,
	];
});

onMounted(() => {
	// Custom brand active
});
</script>

<template>
	<div :class="containerClasses" data-test-id="n8n-logo">
		<img
			:src="aetheraLogo"
			alt="Aethera"
			:class="[$style.aetheraLogoImg, props.collapsed ? $style.aetheraLogoCollapsed : '']"
		/>
		<slot />
	</div>
</template>

<style lang="scss" module>
.logoContainer {
	display: flex;
	justify-content: center;
	align-items: center;
}

.logoText {
	margin-left: var(--spacing--5xs);
	path {
		fill: var(--color--text--shade-1);
	}
}

.large {
	transform: scale(2);
	margin-bottom: var(--spacing--xl);

	.logo,
	.logoText {
		transform: scale(1.3) translateY(-2px);
	}

	.logoText {
		margin-left: var(--spacing--xs);
		margin-right: var(--spacing--3xs);
	}
}

.sidebarExpanded .logo {
	margin-left: var(--spacing--2xs);
}

.aetheraLogoImg {
	max-height: 36px;
	width: auto;
	object-fit: contain;
	display: block;
}

.large .aetheraLogoImg {
	max-height: 48px;
	margin-bottom: var(--spacing--s);
}

.aetheraLogoCollapsed {
	max-height: 28px;
	max-width: 28px;
}
</style>
