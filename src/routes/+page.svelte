<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import confettiGuyImage from '$lib/images/confetti-guy.png';
	import { onMount } from 'svelte';

	let rank = localStorage.getItem('confettiguy-rank') || 'Confetti Trainee';

	let visible = false;
	onMount(() => {
		visible = true;
	});
</script>

{#if visible}
	<header>
		<h1 transition:fly={{ y: -40, duration: 2000 }}>Confetti Guy</h1>
		<p transition:fade={{ duration: 1000, delay: 200 }}>
			Behind every great confetti display, there's someone working hard behind the scenes. Meet
			Confetti Guy.
		</p>
		<img
			transition:fly={{ y: 1000, duration: 1000, delay: 0 }}
			src={confettiGuyImage}
			alt="Drawing of Confetti Guy"
		/>
		<p class="rank">Current Rank: <span>{rank}</span></p>

		<a transition:fly={{ y: 100, duration: 2000 }} href="/game">Begin Work</a>
	</header>
{/if}

<style>
	.rank span {
		font-size: 1.5rem;
	}
</style>
