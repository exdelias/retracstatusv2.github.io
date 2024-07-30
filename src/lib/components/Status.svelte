<script lang="ts">
	import type { Status } from '$lib/types';

	export let name: string;
	const statuses: Status[] = new Array(45);
	for (let i = 0; i < statuses.length; i++) {
		const date = new Date();
		date.setDate(new Date().getDate() - (statuses.length - i));
		const pick = Math.floor(Math.random() * (4 - 1 + 1) + 1);
		const status: Status['status'] = pick < 3 ? 'ok' : pick === 3 ? 'failure' : 'unknown';
		statuses[i] = { date, status };
	}

	function calculateDifferenceInDays(firstDate: Date, secondDate: Date): number {
		const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
		return Math.round(Math.abs((+firstDate - +secondDate) / oneDay)) + 1;
	}

	let message = 'Lacking historical data';
	let lastStatus: Status = { status: 'unknown', date: new Date() };
	if (statuses.length > 0) {
		lastStatus = statuses[statuses.length - 1];
		const operationPercentage = Math.floor(
			(statuses.reduce((prev, current) => prev + (current.status === 'ok' ? 1 : 0), 0) /
				statuses.length) *
				100
		);

		message = `Operation in last ${calculateDifferenceInDays(statuses[0].date, lastStatus.date)} days: ${operationPercentage}%`;
	}
</script>

<div class="my-8">
	<div class="flex justify-between">
		<div class="flex items-center gap-3">
			<div
				class="badge"
				class:badge-success={lastStatus.status === 'ok'}
				class:badge-error={lastStatus.status === 'failure'}
				class:badge-ghost={lastStatus.status === 'unknown'}
			>
				{lastStatus.status === 'ok' ? '✓' : lastStatus.status === 'failure' ? '⤫' : '?'}
			</div>
			<h1 class="text-2xl font-bold">{name}</h1>
		</div>
		<p class="text-neutral-500 text-sm">
			{message}
		</p>
	</div>

	<div class="flex mt-2">
		{#each statuses as { status, date }}
			<div
				data-tip={date.toLocaleDateString('en-US')}
				class:bg-success={status === 'ok'}
				class:bg-neutral-400={status === 'unknown'}
				class:bg-error={status === 'failure'}
				class="tooltip ml-0.5 sm:rounded-lg flex-1 h-8"
			></div>
		{/each}
	</div>
</div>
