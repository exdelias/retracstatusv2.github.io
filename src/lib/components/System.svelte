<script lang="ts">
	import { StatusCode, type Status } from '$lib/types';

	export let systems: Array<[string, Status[]]>;

	const lastState = systems.map(([, status]) => status.at(-1));
	let systemState: StatusCode;
	if (lastState.every((state) => state?.status === StatusCode.OK)) {
		systemState = StatusCode.OK;
	} else if (lastState.every((state) => state?.status === StatusCode.ERROR)) {
		systemState = StatusCode.ERROR;
	} else {
		systemState = StatusCode.UNSTABLE;
	}

	let systemMessage = 'System problem';
	switch (systemState) {
		case StatusCode.OK:
			systemMessage = 'All systems operational';
			break;
		case StatusCode.ERROR:
			systemMessage = 'Total Outage';
			break;
		case StatusCode.UNSTABLE:
			systemMessage = 'Partial outage';
			break;
	}

	const lastUpdate = lastState.sort((a, b) => (a ? +a : 0) - (b ? +b : 0));
</script>

<div class="lg:mx-20 md:my-10">
	<div class="card bg-base-100 w-full my-8 shadow-xl">
		<div class="card-body">
			<div class="flex flex-col md:flex-row gap-y-4 items-center justify-between">
				<div class="flex items-center gap-2">
					<div
						class="badge"
						class:badge-success={systemState === StatusCode.OK}
						class:badge-error={systemState === StatusCode.ERROR}
						class:badge-warning={systemState === StatusCode.UNSTABLE}
					>
						{systemState === StatusCode.OK ? '✓' : systemState === StatusCode.ERROR ? '⤫' : '?'}
					</div>
					<h2 class="card-title">{systemMessage}</h2>
				</div>
				<h3 class="text-sm text-neutral-500 md:min-w-32">
					Last update {lastUpdate[0]?.date.toLocaleDateString('en-US', {
						month: 'long',
						day: '2-digit',
						year: 'numeric',
						hour: '2-digit',
						minute: '2-digit'
					})}
				</h3>
			</div>
		</div>
	</div>
</div>
