<script lang="ts">
  import { onMount } from 'svelte';
  import type { Chart } from 'chart.js';
  let {
    labels,
    values,
    type = 'bar',
    label = 'Akurasi (%)',
    colors = ['#8da57e'],
    percentage = true
  }: {
    labels: string[];
    values: (number | null)[];
    type?: 'bar' | 'line';
    label?: string;
    colors?: string[];
    percentage?: boolean;
  } = $props();
  let canvas: HTMLCanvasElement;
  let chart: Chart | undefined;
  let ready = $state(false);
  onMount(() => {
    let destroyed = false;
    void import('chart.js/auto').then(({ default: Chart }) => {
      if (destroyed) return;
      chart = new Chart(canvas, {
        type,
        data: {
          labels,
          datasets: [
            {
              label,
              data: values,
              backgroundColor: colors,
              borderColor: '#87a275',
              borderRadius: 6,
              borderWidth: type === 'line' ? 2 : 0,
              barPercentage: 0.45,
              tension: 0.3,
              pointRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              ...(percentage ? { max: 100 } : {}),
              grid: { color: '#edf0e5' },
              ticks: {
                color: '#65715b',
                font: { size: 11 },
                callback: (value) => (percentage ? `${value}%` : value)
              }
            },
            x: { grid: { display: false }, ticks: { color: '#65715b', font: { size: 11 } } }
          }
        }
      });
      ready = true;
    });
    return () => {
      destroyed = true;
      chart?.destroy();
    };
  });
  $effect(() => {
    if (ready && chart) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = values;
      chart.update('none');
    }
  });
</script>

<div
  class="chart-wrap"
  role="img"
  aria-label={`${label}: ${labels.map((l, i) => `${l} ${values[i] ?? 'belum ada data'}${percentage ? '%' : ''}`).join(', ')}`}
>
  <canvas bind:this={canvas} aria-hidden="true"></canvas>
</div>
