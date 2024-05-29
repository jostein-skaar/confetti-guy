<script lang="ts">
	import confettiGuyImage from '$lib/images/confetti-guy.png';

	import { page } from '$app/stores';
	const rank = $page.url.searchParams.get('rank');
</script>

<header>
	<h1>Rank: {rank}</h1>

	{#if rank?.includes('Confetti Guy')}
		<p>Great work! You are truly a Confetti Guy!</p>
	{:else}
		<p>You still have a lot to learn!</p>
	{/if}

	<img src={confettiGuyImage} alt="Drawing of Confetti Guy" />
	<a href="/game">Try Again</a>
</header>
