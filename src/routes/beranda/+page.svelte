<script lang="ts">
  import LearningHome from '$lib/components/LearningHome.svelte';
  import PilotHome from '$lib/pilot/PilotHome.svelte';
  import { page } from '$app/state';
  let { data } = $props();
</script>

{#if page.url.searchParams.has('legacy')}<LearningHome authenticated />{:else}<PilotHome
    cards={data.cards}
    sessions={data.sessions}
  />{/if}
