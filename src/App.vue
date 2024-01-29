<script setup lang="ts">
import { onMounted } from "vue";
import { tryConnect } from "@/eth";
import HeaderVue from "@/components/Header.vue";
import nProgress from "nprogress";
import { useRouter } from "vue-router";

nProgress.configure({ showSpinner: false });

onMounted(() => {
  tryConnect();

  useRouter().beforeEach(() => {
    nProgress.start();
  });

  useRouter().afterEach((to) => {
    nProgress.done();
  });
});
</script>

<template lang="pug">
HeaderVue
RouterView
</template>
