<script lang="ts">
	export let totalTime: string;
</script>

<main>
	<header>
		<h2 class="is-flex is-align-content-center">
			<span>This week</span>
			<span class="mx-2 header-divider-bullet">•</span>
			<span class="header-total-time">{totalTime}</span>
		</h2>
	</header>
	<header />
</main>

<style>
	.header-total-time {
		font-weight: 300;
	}

	.header-divider-bullet {
		font-size: 0.75em;
		margin-top: 0.25em;
	}
</style>
