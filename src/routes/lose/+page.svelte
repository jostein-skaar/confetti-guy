<script lang="ts">
	import confettiGuyImage from '$lib/images/confetti-guy.png';

	import { page } from '$app/stores';
	const score = $page.url.searchParams.get('score');
</script>

<header>
	<h1>Score: {score}</h1>
	<p>Great work!</p>
	<img src={confettiGuyImage} alt="Drawing of Confetti Guy" />
	<a href="/game">Try Again</a>
</header>
