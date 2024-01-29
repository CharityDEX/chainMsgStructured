<script setup lang="ts">
import { type Ref, ref, onMounted, watch } from "vue";
import * as jdenticon from "jdenticon";

const { address } = defineProps<{
  address: string;
}>();

const svgRef: Ref<SVGElement | null> = ref(null);

function updateSvg() {
  jdenticon.updateSvg(svgRef.value!, address);
}

onMounted(() => {
  updateSvg();
});

watch(() => address, updateSvg);
</script>

<template lang="pug">
.pfp.flex.items-center.justify-center.overflow-hidden
  svg.h-full.w-full(ref="svgRef")
</template>
