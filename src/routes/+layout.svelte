<script lang="ts">
	import '../app.css';
</script>

<slot />
<footer class="footer footer-center bg-base-300 text-base-content p-4 sticky top-[100vh]">
	<aside>
		<p>
			<a href="https://github.com/Bullrich/GitHub-Status-Page">GitHub-Status-Page</a> made with ❤️
			by <a href="https://bullrich.dev">Bullrich</a>
		</p>
	</aside>
</footer>

<style lang="postcss">
	a {
		@apply text-primary link hover:text-secondary;
	}
</style>
