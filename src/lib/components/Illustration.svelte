<script lang="ts">
  let { kind = 'owl', class: className = '' }: { kind?: 'owl' | 'fox' | 'garden'; class?: string } =
    $props();
</script>

<svg
  class={className}
  viewBox="0 0 340 260"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
  <ellipse cx="174" cy="235" rx="123" ry="12" fill="#254D3F" opacity=".07" />
  {#if kind === 'fox'}
    <path d="M267 182c70 3 46-97 16-74 10 39-52 20-34 65" fill="#E99450" /><path
      d="M286 109c25-15 40 27 23 47l-27-17z"
      fill="#FFF0DB"
    />
    <path d="M105 118 83 31c39 1 62 36 68 50M194 80c16-36 40-48 65-46l-23 90" fill="#D98242" />
    <path d="m100 76-4-25 37 30m87 0 24-29-5 31" fill="#FFE1B3" />
    <path d="M104 122c-8-67 127-86 141-5l-17 78c-7 48-104 42-115-1z" fill="#F4AA63" />
    <path
      d="M102 125c39 0 63 19 71 44 14-28 40-44 72-44-11 71-37 91-72 91-37 0-64-26-71-91"
      fill="#FFF2DC"
    />
    <path
      d="M143 134q7-12 14 0m39 0q7-12 14 0"
      stroke="#4A4238"
      stroke-width="5"
      stroke-linecap="round"
    />
    <path d="m167 163 15 0-7 9z" fill="#4A4238" /><path
      d="M175 175q10 13 20 0"
      stroke="#4A4238"
      stroke-width="3"
      stroke-linecap="round"
    />
    <ellipse cx="133" cy="153" rx="12" ry="6" fill="#F5B3A0" /><ellipse
      cx="218"
      cy="153"
      rx="12"
      ry="6"
      fill="#F5B3A0"
    />
    <path d="m80 190 58-15 9 42-58 15z" fill="#80AAA0" /><path
      d="m138 175 57 11 9 42-57-11z"
      fill="#AFCDB8"
    /><path d="m139 177 9 39" stroke="#477561" stroke-width="3" />
    <path
      d="M110 184q-23 4-16 21m111-13q27-12 28 5"
      stroke="#D98242"
      stroke-width="16"
      stroke-linecap="round"
    />
    <path
      d="m55 112 4-11 5 11 11 4-11 4-5 11-4-11-11-4zM280 65l3-8 4 8 8 3-8 3-4 8-3-8-8-3z"
      fill="#F6C45C"
    />
  {:else}
    <path
      d="M78 220c-18-15-28-30-20-36 8-7 19 14 22 21-9-32-4-51 5-49 12 3 6 34 4 46 15-26 28-26 31-17 4 10-18 26-33 35"
      fill="#9BB999"
    />
    <path
      d="M258 223c-5-32 11-61 19-54 8 6-5 28-10 37 26-19 43-15 38-4-4 8-25 16-39 21"
      fill="#7FA793"
    />
    <path d="m112 80-1-46 47 28m37 1 44-29-2 49" fill="#7AA58C" />
    <path d="M99 127c0-86 150-88 150 0v52c0 67-150 67-150 0z" fill="#90B89B" />
    <ellipse cx="173" cy="169" rx="55" ry="58" fill="#CFE0BE" />
    <path d="M98 137c-40 14-41 67 8 64m143-64c40 14 41 67-8 64" fill="#719D83" />
    <circle cx="140" cy="119" r="34" fill="#FDF8E9" /><circle
      cx="208"
      cy="119"
      r="34"
      fill="#FDF8E9"
    />
    <circle cx="146" cy="121" r="11" fill="#344E40" /><circle
      cx="202"
      cy="121"
      r="11"
      fill="#344E40"
    />
    <circle cx="149" cy="117" r="3.5" fill="white" /><circle
      cx="205"
      cy="117"
      r="3.5"
      fill="white"
    />
    <path d="m164 143 21 0-10 16z" fill="#ECAF58" />
    <ellipse cx="121" cy="145" rx="12" ry="6" fill="#E3AD94" /><ellipse
      cx="227"
      cy="145"
      rx="12"
      ry="6"
      fill="#E3AD94"
    />
    <path
      d="M98 101c-5-81 150-81 152 0"
      stroke="#426C58"
      stroke-width="12"
      stroke-linecap="round"
    />
    <rect x="90" y="99" width="15" height="42" rx="7" fill="#426C58" /><rect
      x="242"
      y="99"
      width="15"
      height="42"
      rx="7"
      fill="#426C58"
    />
    <path d="m115 197 60-12 4 43-61 8z" fill="#F9E5AE" /><path
      d="m175 185 58 13-3 41-51-11z"
      fill="#FFEFCC"
    /><path d="m175 187 4 40" stroke="#CCAB72" stroke-width="3" />
    <path
      d="m128 206 30-5m-28 14 30-5m28-8 28 7m-28 3 27 7"
      stroke="#D7BA83"
      stroke-width="3"
      stroke-linecap="round"
    />
    <path
      d="M119 230v8m17-10v10m75-7v7m16-7v7"
      stroke="#D7A557"
      stroke-width="6"
      stroke-linecap="round"
    />
    <path
      d="m64 76 5-13 5 13 13 5-13 5-5 13-5-13-13-5zM279 113l4-9 3 9 10 4-10 3-3 10-4-10-9-3z"
      fill="#EAC16B"
    />
    <path d="M279 55v27m-8-18v10m16-9v8" stroke="#83A6AC" stroke-width="4" stroke-linecap="round" />
  {/if}
</svg>
