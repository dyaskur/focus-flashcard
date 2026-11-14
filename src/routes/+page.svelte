<script lang="ts">
  import LearningHome from '$lib/components/LearningHome.svelte';
  let { data } = $props();
</script>

<LearningHome authenticated={!!data.user} />
