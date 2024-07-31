<script lang="ts">
	import { page } from '$app/stores';
</script>

<section class="flex items-center h-screen p-16">
	<div class="container flex flex-col items-center">
		<div class="flex flex-col gap-6 max-w-md text-center">
			<h2 class="font-extrabold text-5xl text-error">Error</h2>
			<p class="text-2xl md:text-3xl text-neutral-500">{$page.error?.message ?? 'ERROR'}</p>
		</div>
	</div>
</section>
