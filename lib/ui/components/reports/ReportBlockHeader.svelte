<script lang="ts">
	export let title: string;
	export let totalTime: string;
</script>

<main>
	<header>
		<h2 class="is-flex is-align-content-center">
			<span>{title}</span>
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
		font-weight: 100;
	}
</style>
