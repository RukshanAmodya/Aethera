<script setup lang="ts">
import aetheraLogo from './aethera-logo.png';
import SSOLogin from '@/features/settings/sso/components/SSOLogin.vue';
import type { FormFieldValueUpdate, IFormBoxConfig } from '@/Interface';
import type { EmailOrLdapLoginIdAndPassword } from './SigninView.vue';
import { N8nFormBox, N8nText } from '@n8n/design-system';

withDefaults(
	defineProps<{
		form: IFormBoxConfig;
		formLoading?: boolean;
		subtitle?: string;
		withSso?: boolean;
	}>(),
	{
		formLoading: false,
		withSso: false,
	},
);

const emit = defineEmits<{
	update: [FormFieldValueUpdate];
	submit: [values: EmailOrLdapLoginIdAndPassword];
	secondaryClick: [];
}>();

const onUpdate = (e: FormFieldValueUpdate) => {
	emit('update', e);
};

const onSubmit = (data: unknown) => {
	emit('submit', data as EmailOrLdapLoginIdAndPassword);
};

const onSecondaryClick = () => {
	emit('secondaryClick');
};
</script>

<template>
	<div :class="$style.pageWrapper">
		<div :class="$style.authCard">
			<!-- Left Hero Column -->
			<div :class="$style.heroColumn">
				<div :class="$style.heroTop">
					<div :class="$style.brandHeader">
						<img :src="aetheraLogo" alt="Aethera" :class="$style.brandLogo" />
					</div>
				</div>

				<div :class="$style.heroCenter">
					<div :class="$style.badgePill">
						<span>Join Us to Build 🚀</span>
					</div>
					<h1 :class="$style.heroTitle">Start your Journey</h1>
					<p :class="$style.heroSubtitle">
						Build, orchestrate, and deploy powerful AI & automation workflows effortlessly.
					</p>
				</div>

				<div :class="$style.heroSteps">
					<div :class="[$style.stepCard, $style.stepActive]">
						<div :class="$style.stepBadge">1</div>
						<div :class="$style.stepContent">
							<span :class="$style.stepTitle">Register your account</span>
						</div>
					</div>

					<div :class="$style.stepCard">
						<div :class="$style.stepBadge">2</div>
						<div :class="$style.stepContent">
							<span :class="$style.stepTitle">Build workflows & connect</span>
						</div>
					</div>

					<div :class="$style.stepCard">
						<div :class="$style.stepBadge">3</div>
						<div :class="$style.stepContent">
							<span :class="$style.stepTitle">Deploy and automate</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Right Form Column -->
			<div :class="$style.formColumn">
				<div :class="$style.formInner">
					<div v-if="subtitle" :class="$style.textContainer">
						<N8nText size="large">{{ subtitle }}</N8nText>
					</div>

					<div :class="$style.formContainer">
						<N8nFormBox
							v-bind="form"
							data-test-id="auth-form"
							:button-loading="formLoading"
							@secondary-click="onSecondaryClick"
							@submit="onSubmit"
							@update="onUpdate"
						>
							<SSOLogin v-if="withSso" />
						</N8nFormBox>
					</div>

					<div :class="$style.footerTerms">
						<p>
							By continuing, you agree to Aethera's
							<a href="#" @click.prevent>Terms of Service</a> and
							<a href="#" @click.prevent>Privacy Policy</a>.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style lang="scss" module>
.pageWrapper {
	min-height: 100vh;
	width: 100vw;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #121316;
	background-image:
		radial-gradient(at 15% 15%, rgba(37, 99, 235, 0.12) 0px, transparent 50%),
		radial-gradient(at 85% 85%, rgba(56, 189, 248, 0.08) 0px, transparent 50%);
	padding: 24px;
	box-sizing: border-box;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.authCard {
	display: flex;
	width: 100%;
	max-width: 1080px;
	min-height: 660px;
	background: #ffffff;
	border-radius: 28px;
	box-shadow:
		0 20px 50px -10px rgba(0, 0, 0, 0.45),
		0 0 0 1px rgba(255, 255, 255, 0.08);
	overflow: hidden;
	position: relative;

	@media (max-width: 860px) {
		flex-direction: column;
		max-width: 500px;
		min-height: auto;
		border-radius: 22px;
	}
}

/* Left Hero Column */
.heroColumn {
	flex: 1 1 48%;
	background: linear-gradient(145deg, #1d4ed8 0%, #2563eb 45%, #38bdf8 100%);
	padding: 44px 40px;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	color: #ffffff;
	position: relative;
	overflow: hidden;
	box-sizing: border-box;

	&::before {
		content: '';
		position: absolute;
		top: -120px;
		right: -100px;
		width: 320px;
		height: 320px;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 70%);
		border-radius: 50%;
		pointer-events: none;
	}

	&::after {
		content: '';
		position: absolute;
		bottom: -80px;
		left: -60px;
		width: 240px;
		height: 240px;
		background: radial-gradient(circle, rgba(29, 78, 216, 0.4) 0%, rgba(29, 78, 216, 0) 70%);
		border-radius: 50%;
		pointer-events: none;
	}

	@media (max-width: 860px) {
		padding: 32px 24px;
	}
}

.heroTop {
	position: relative;
	z-index: 2;
}

.brandHeader {
	display: flex;
	align-items: center;
}

.brandLogo {
	max-height: 85px;
	width: auto;
	object-fit: contain;
	filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.25));
}

.heroCenter {
	margin: 40px 0;
	position: relative;
	z-index: 2;
}

.badgePill {
	display: inline-flex;
	align-items: center;
	background: rgba(255, 255, 255, 0.18);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	border: 1px solid rgba(255, 255, 255, 0.25);
	padding: 6px 16px;
	border-radius: 9999px;
	font-size: 13px;
	font-weight: 500;
	color: #ffffff;
	margin-bottom: 20px;
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.heroTitle {
	font-size: 34px;
	font-weight: 700;
	line-height: 1.2;
	letter-spacing: -0.02em;
	color: #ffffff;
	margin: 0 0 12px 0;
	text-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.heroSubtitle {
	font-size: 15px;
	line-height: 1.5;
	color: rgba(255, 255, 255, 0.88);
	margin: 0;
	max-width: 380px;
}

/* Stepped Cards */
.heroSteps {
	display: flex;
	gap: 12px;
	position: relative;
	z-index: 2;

	@media (max-width: 860px) {
		display: none;
	}
}

.stepCard {
	flex: 1;
	background: rgba(255, 255, 255, 0.14);
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);
	border: 1px solid rgba(255, 255, 255, 0.18);
	border-radius: 16px;
	padding: 16px 14px;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	min-height: 104px;
	transition: all 0.25s ease;
	box-sizing: border-box;

	&:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
	}
}

.stepActive {
	background: #ffffff;
	border-color: #ffffff;
	box-shadow: 0 10px 25px -4px rgba(0, 0, 0, 0.15);

	.stepBadge {
		background: #2563eb;
		color: #ffffff;
	}

	.stepTitle {
		color: #0f172a;
		font-weight: 600;
	}

	&:hover {
		background: #ffffff;
	}
}

.stepBadge {
	width: 26px;
	height: 26px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.28);
	color: #ffffff;
	font-size: 13px;
	font-weight: 600;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 12px;
}

.stepContent {
	display: flex;
	flex-direction: column;
}

.stepTitle {
	font-size: 12px;
	line-height: 1.35;
	color: rgba(255, 255, 255, 0.92);
	font-weight: 500;
}

/* Right Form Column */
.formColumn {
	flex: 1 1 52%;
	background: #ffffff;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 48px 44px;
	box-sizing: border-box;
	overflow-y: auto;

	@media (max-width: 860px) {
		padding: 36px 24px;
	}
}

.formInner {
	width: 100%;
	max-width: 380px;
	display: flex;
	flex-direction: column;
}

.textContainer {
	text-align: center;
	margin-bottom: 20px;
}

.formContainer {
	width: 100%;

	/* Stylize N8nFormBox seamless integration */
	:global(.n8n-form-box) {
		background: transparent !important;
		border: none !important;
		box-shadow: none !important;
		padding: 0 !important;
	}

	:global(.n8n-form-box > div:first-child) {
		margin-bottom: 28px !important;
		text-align: center;
	}

	/* Title typography */
	:global(.n8n-form-box h1),
	:global(.n8n-form-box h2),
	:global(.n8n-form-box .n8n-heading) {
		font-size: 28px !important;
		font-weight: 700 !important;
		color: #0f172a !important;
		letter-spacing: -0.02em !important;
	}

	/* Form input aesthetics */
	:global(.n8n-input),
	:global(.el-input) {
		--input--color--background: #ffffff !important;
		--input--color--text: #0f172a !important;
		--input--placeholder--color: #94a3b8 !important;
		--input--border-color: #cbd5e1 !important;
		--input--border--shadow: 0 0 0 1px #cbd5e1 !important;
		--color--neutral-white: #ffffff !important;
		--color--neutral-950: #ffffff !important;
		--color--text--shade-1: #0f172a !important;
		--color--text--tint-1: #94a3b8 !important;
		width: 100% !important;
	}

	:global(.n8n-input > div),
	:global(.n8n-input__wrapper),
	:global([class*="inputWrapper"]),
	:global(.el-input__wrapper) {
		background-color: #ffffff !important;
		background: #ffffff !important;
		border-radius: 12px !important;
		box-shadow: 0 0 0 1px #cbd5e1 inset !important;
		transition: all 0.2s ease !important;
	}

	:global(.n8n-input > div:hover),
	:global(.n8n-input__wrapper:hover),
	:global([class*="inputWrapper"]:hover),
	:global(.el-input__wrapper:hover) {
		box-shadow: 0 0 0 1px #3b82f6 inset !important;
		background-color: #ffffff !important;
		background: #ffffff !important;
	}

	:global(.n8n-input > div:focus-within),
	:global(.n8n-input__wrapper:focus-within),
	:global([class*="inputWrapper"]:focus-within),
	:global(.el-input__wrapper.is-focus) {
		box-shadow: 0 0 0 2px #2563eb inset, 0 0 0 4px rgba(37, 99, 235, 0.15) !important;
		background-color: #ffffff !important;
		background: #ffffff !important;
	}

	:global(.n8n-input input),
	:global([class*="inputWrapper"] input),
	:global(.el-input__inner) {
		background: transparent !important;
		background-color: transparent !important;
		color: #0f172a !important;
		-webkit-text-fill-color: #0f172a !important;
		font-size: 14.5px !important;
		font-weight: 500 !important;
		font-family: inherit !important;
		caret-color: #2563eb !important;
	}

	:global(.n8n-input input::placeholder),
	:global([class*="inputWrapper"] input::placeholder),
	:global(.el-input__inner::placeholder) {
		color: #94a3b8 !important;
		-webkit-text-fill-color: #94a3b8 !important;
		font-weight: 400 !important;
	}

	:global(.n8n-input-label label),
	:global(.n8n-form-input label),
	:global(label) {
		font-size: 13.5px !important;
		font-weight: 600 !important;
		color: #1e293b !important;
		margin-bottom: 6px !important;
	}

	/* Action submit button */
	:global(button[data-test-id="form-submit-button"]) {
		width: 100% !important;
		height: 46px !important;
		border-radius: 12px !important;
		background: #2563eb !important;
		border-color: #2563eb !important;
		font-size: 15px !important;
		font-weight: 600 !important;
		color: #ffffff !important;
		box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3) !important;
		transition: all 0.2s ease !important;

		&:hover {
			background: #1d4ed8 !important;
			border-color: #1d4ed8 !important;
			box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4) !important;
			transform: translateY(-1px);
		}

		&:active {
			transform: translateY(0);
		}
	}

	/* Redirect / Forgot password link */
	:global(.n8n-form-box a),
	:global(.n8n-link) {
		color: #2563eb !important;
		font-weight: 500 !important;
		font-size: 13px !important;
		text-decoration: none !important;

		&:hover {
			text-decoration: underline !important;
		}
	}
}

.footerTerms {
	margin-top: 24px;
	text-align: center;

	p {
		font-size: 12px;
		line-height: 1.5;
		color: #94a3b8;
		margin: 0;

		a {
			color: #64748b;
			text-decoration: underline;
			transition: color 0.2s;

			&:hover {
				color: #2563eb;
			}
		}
	}
}
</style>
