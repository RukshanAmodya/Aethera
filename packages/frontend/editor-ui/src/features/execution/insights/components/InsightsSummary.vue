<script setup lang="ts">
import { useTelemetry } from '@n8n/composables/useTelemetry';
import { VIEWS } from '@/app/constants';
import {
	INSIGHT_IMPACT_TYPES,
	INSIGHTS_UNIT_IMPACT_MAPPING,
} from '@/features/execution/insights/insights.constants';
import type { InsightsSummaryDisplay } from '@/features/execution/insights/insights.types';
import type { DateValue } from '@internationalized/date';
import type { InsightsSummary } from '@n8n/api-types';
import { N8nIcon, N8nTooltip } from '@n8n/design-system';
import { useI18n } from '@n8n/i18n';
import { smartDecimal } from '@n8n/utils/number/smart-decimal';
import { computed, useCssModule } from 'vue';
import { I18nT } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { formatDateRange, getMatchingPreset, getTimeRangeLabels } from '../insights.utils';

const props = defineProps<{
	summary: InsightsSummaryDisplay;
	startDate?: DateValue;
	endDate?: DateValue;
	loading?: boolean;
}>();

const i18n = useI18n();
const route = useRoute();
const $style = useCssModule();
const telemetry = useTelemetry();

const timeRangeLabels = getTimeRangeLabels();

const displayDateRangeLabel = computed(() => {
	const timeRangeKey = getMatchingPreset({
		start: props.startDate,
		end: props.endDate,
	});

	if (timeRangeKey) {
		return timeRangeLabels[timeRangeKey];
	}

	return formatDateRange({ start: props.startDate, end: props.endDate });
});

const summaryTitles = computed<Record<keyof InsightsSummary, string>>(() => ({
	total: i18n.baseText('insights.banner.title.total'),
	failed: i18n.baseText('insights.banner.title.failed'),
	failureRate: i18n.baseText('insights.banner.title.failureRate'),
	timeSaved: i18n.baseText('insights.banner.title.timeSaved'),
	averageRunTime: i18n.baseText('insights.banner.title.averageRunTime'),
}));

const summaryHasNoData = computed(() => {
	const summaryValues = Object.values(props.summary);
	return summaryValues.length > 0 && summaryValues.every((summary) => !summary.value);
});

const summaryWithRouteLocations = computed(() =>
	props.summary.map((s) => ({
		...s,
		to: { name: VIEWS.INSIGHTS, params: { insightType: s.id }, query: route.query },
	})),
);

const getImpactStyle = (id: keyof InsightsSummary, value: number) => {
	const impact = INSIGHTS_UNIT_IMPACT_MAPPING[id];
	if (value === 0 || impact === INSIGHT_IMPACT_TYPES.NEUTRAL) {
		return $style.neutral;
	}
	if (impact === INSIGHT_IMPACT_TYPES.POSITIVE) {
		return value > 0 ? $style.positive : $style.negative;
	}
	if (impact === INSIGHT_IMPACT_TYPES.NEGATIVE) {
		return value < 0 ? $style.positive : $style.negative;
	}
	return $style.neutral;
};

const trackTabClick = (insightType: keyof InsightsSummary) => {
	telemetry.track(`User clicked ${summaryTitles.value[insightType]}`, {
		referrer: route.name === VIEWS.INSIGHTS ? 'Dashboard' : 'Overview',
	});
};
</script>

<template>
	<div :class="$style.insightsWrapper">
		<div :class="$style.insights">
			<ul data-test-id="insights-summary-tabs" :class="$style.cardsGrid">
				<li
					v-for="({ id, value, deviation, deviationUnit, unit, to }, index) in summaryWithRouteLocations"
					:key="id"
					:data-test-id="`insights-summary-tab-${id}`"
					:class="[$style.cardItem, index === 0 && $style.featuredCard]"
				>
					<N8nTooltip
						:placement="route.name === VIEWS.INSIGHTS ? 'bottom' : 'top'"
						:disabled="!(summaryHasNoData && id === 'total')"
						:show-after="500"
					>
						<template #content>
							<I18nT keypath="insights.banner.noData.tooltip" scope="global">
								<template #link>
									<a
										:href="i18n.baseText('insights.banner.noData.tooltip.link.url')"
										target="_blank"
									>
										{{ i18n.baseText('insights.banner.noData.tooltip.link') }}
									</a>
								</template>
							</I18nT>
						</template>
						<RouterLink :to="to" :exact-active-class="$style.activeTab" :class="$style.cardLink" @click="trackTabClick(id)">
							<div :class="$style.cardHeader">
								<strong :class="$style.cardTitle">
									<N8nTooltip placement="bottom" :disabled="id !== 'timeSaved'">
										<template #content>
											{{ i18n.baseText('insights.banner.title.timeSaved.tooltip') }}
										</template>
										{{ summaryTitles[id] }}
									</N8nTooltip>
								</strong>
								<div :class="$style.arrowPill">
									<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
										<line x1="7" y1="17" x2="17" y2="7"></line>
										<polyline points="7 7 17 7 17 17"></polyline>
									</svg>
								</div>
							</div>

							<div :class="$style.cardValueRow">
								<span v-if="value === 0 && id === 'timeSaved'" :class="$style.empty">
									<em :class="$style.valueNumber">--</em>
									<small :class="$style.infoHint">
										<N8nTooltip placement="bottom">
											<template #content>
												<I18nT keypath="insights.banner.timeSaved.tooltip" scope="global">
													<template #link>{{
														i18n.baseText('insights.banner.timeSaved.tooltip.link.text')
													}}</template>
												</I18nT>
											</template>
											<N8nIcon :class="$style.icon" icon="info" size="medium" />
										</N8nTooltip>
									</small>
								</span>
								<span v-else :class="$style.valueWrap">
									<em :class="$style.valueNumber">
										{{ smartDecimal(value).toLocaleString('en-US') }}<i v-if="unit" :class="$style.unit">{{ unit }}</i>
									</em>
								</span>
							</div>

							<div :class="$style.cardFooter">
								<div v-if="deviation !== null" :class="[$style.badge, getImpactStyle(id, deviation)]">
									<N8nIcon
										:class="[$style.badgeIcon, getImpactStyle(id, deviation)]"
										:icon="
											deviation === 0
												? 'chevron-right'
												: deviation > 0
													? 'chevron-up'
													: 'chevron-down'
										"
									/>
									<span>
										{{ smartDecimal(Math.abs(deviation)).toLocaleString('en-US') }}{{ deviationUnit }}
									</span>
								</div>
								<div v-else :class="$style.badge">
									<span v-if="index === 0">⚡ Active pipeline</span>
									<span v-else-if="id === 'failed'">✓ All passing</span>
									<span v-else-if="id === 'failureRate'">✓ 100% Reliability</span>
									<span v-else-if="id === 'timeSaved'">⏱️ Time optimized</span>
									<span v-else>⚡ Sub-second latency</span>
								</div>
							</div>
						</RouterLink>
					</N8nTooltip>
				</li>
			</ul>
		</div>
	</div>
</template>

<style lang="scss" module>
.insightsWrapper {
	position: relative;
	padding: var(--spacing--xs) 0 0;
	margin-bottom: var(--spacing--xl);
}

.insights {
	width: 100%;
}

.cardsGrid {
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	gap: 14px;
	list-style: none;
	padding: 0;
	margin: 0;
	border: none;
	overflow: visible;

	@media (max-width: 1280px) {
		grid-template-columns: repeat(3, 1fr);
	}

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
}

.cardItem {
	display: flex;
	border: none !important;
	padding: 0;
	margin: 0;
}

.cardLink {
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	width: 100%;
	min-height: 136px;
	padding: 16px 18px;
	border-radius: 18px;
	background: light-dark(#fff, #11131a);
	border: 1px solid light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.08));
	box-shadow:
		0 6px 18px -4px light-dark(rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.5)),
		0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.2));
	text-decoration: none !important;
	transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
	cursor: pointer;

	&:hover {
		transform: translateY(-3px);
		box-shadow:
			0 14px 32px -6px light-dark(rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.65)),
			0 0 0 1px light-dark(rgba(16, 185, 129, 0.35), rgba(34, 197, 94, 0.45));
		border-color: light-dark(rgba(16, 185, 129, 0.3), rgba(34, 197, 94, 0.4));

		.arrowPill {
			background: light-dark(rgba(16, 185, 129, 0.15), rgba(34, 197, 94, 0.2));
			color: #10b981;
			transform: scale(1.08);
		}
	}
}

/* Featured 1st Card: Rich Forest Green Gradient matching the Donezo reference design */
.featuredCard {
	.cardLink {
		background: linear-gradient(145deg, #064e3b 0%, #04382a 50%, #02261c 100%);
		border: 1px solid rgba(52, 211, 153, 0.35);
		box-shadow:
			0 12px 32px -4px rgba(6, 78, 59, 0.45),
			0 2px 6px rgba(0, 0, 0, 0.2);

		.cardTitle {
			color: #a7f3d0;
		}

		.arrowPill {
			background: rgba(255, 255, 255, 0.14);
			color: #fff;
			border: 1px solid rgba(255, 255, 255, 0.2);
		}

		.valueNumber {
			color: #fff !important;
		}

		.unit {
			color: #a7f3d0;
		}

		.badge {
			background: rgba(255, 255, 255, 0.14);
			color: #d1fae5;
			border: 1px solid rgba(255, 255, 255, 0.2);
		}

		&:hover {
			border-color: rgba(52, 211, 153, 0.6);
			box-shadow:
				0 16px 36px -4px rgba(6, 78, 59, 0.6),
				0 0 0 1px rgba(52, 211, 153, 0.5);

			.arrowPill {
				background: rgba(255, 255, 255, 0.25);
				color: #fff;
			}
		}
	}
}

.cardHeader {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	margin-bottom: 10px;
}

.cardTitle {
	font-size: 12.5px;
	font-weight: 600;
	color: light-dark(#64748b, #94a3b8);
	letter-spacing: -0.01em;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.arrowPill {
	width: 24px;
	height: 24px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.06));
	color: light-dark(#64748b, #94a3b8);
	border: 1px solid light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.1));
	transition: all 0.2s ease;
	flex-shrink: 0;
}

.cardValueRow {
	display: flex;
	align-items: baseline;
	margin-bottom: 10px;
}

.valueWrap {
	display: flex;
	align-items: baseline;
}

.valueNumber {
	font-size: 28px;
	font-weight: 700;
	font-style: normal;
	line-height: 1.1;
	letter-spacing: -0.03em;
	color: light-dark(#0f172a, #f8fafc);
	font-family: inherit;
}

.unit {
	font-size: 16px;
	font-style: normal;
	font-weight: 500;
	color: light-dark(#64748b, #94a3b8);
	margin-left: 3px;
}

.cardFooter {
	display: flex;
	align-items: center;
	width: 100%;
	margin-top: auto;
}

.badge {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 2.5px 8px;
	border-radius: 9999px;
	font-size: 10.5px;
	font-weight: 600;
	letter-spacing: 0.01em;
	background: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.06));
	color: light-dark(#64748b, #94a3b8);
	border: 1px solid light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.08));

	&.positive {
		background: rgba(16, 185, 129, 0.12);
		color: #10b981;
		border-color: rgba(16, 185, 129, 0.25);
	}

	&.negative {
		background: rgba(239, 68, 68, 0.12);
		color: #ef4444;
		border-color: rgba(239, 68, 68, 0.25);
	}

	&.neutral {
		background: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.06));
		color: light-dark(#64748b, #94a3b8);
	}
}

.badgeIcon {
	font-size: 11px;
}

.empty {
	display: flex;
	align-items: center;
	gap: 6px;

	em {
		font-size: 28px;
		font-weight: 700;
		font-style: normal;
		color: light-dark(#94a3b8, #64748b);
	}
}

.infoHint {
	display: flex;
	align-items: center;
	color: light-dark(#94a3b8, #64748b);
}

.positive {
	color: #10b981;
}

.negative {
	color: #ef4444;
}

.neutral {
	color: light-dark(#64748b, #94a3b8);
}
</style>
