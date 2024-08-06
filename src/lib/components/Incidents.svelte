<script lang="ts">
	import type { ReportFile } from '$lib/types';
	import moment from 'moment';

	export let incidents: ReportFile['incidents'];
</script>

<div class="">
	<h1 class="text-2xl font-bold text-left">Recent incidents</h1>
	<ul class="timeline timeline-vertical mt-4 lg:mt10">
		{#each incidents as incident, i}
			<li>
				{#if i > 0}
					<hr class:bg-primary={incident.open} />
				{/if}
				<div class="timeline-start">{moment.unix(incident.date).format('MMM Do YY')}</div>
				<div class="timeline-middle" class:text-primary={incident.open}>
					<div class="badge" class:badge-primary={incident.open}>
						{#if incident.open}
							⤫
						{:else}
							✓
						{/if}
					</div>
				</div>
				<div class="timeline-end timeline-box">{incident.title}</div>

				{#if i < incidents.length - 1}
					<hr class:bg-primary={incident.open} />
				{/if}
			</li>
		{/each}
	</ul>
</div>
