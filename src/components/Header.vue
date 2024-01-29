<script setup lang="ts">
import { type Ref, ref } from "vue";
import { connect, disconnect, wallet, mailboxContract, onConnect } from "@/eth";
import { getRegisteredEvent } from "@/eth/mailbox";
import { ethers } from "ethers";
import PFP from "./PFP.vue";
import Spinner from "./Spinner.vue";

const isRegistered: Ref<undefined | boolean> = ref();

async function login() {
  const input = window.prompt("Enter your private key");

  if (!input) {
    return;
  }

  try {
    await connect(input);
  } catch (e: any) {
    alert(e.message);
  }
}

async function logout() {
  disconnect();

  // Reload window
  window.location.reload();
}

async function register() {
  try {
    isRegistered.value = undefined;
    const tx = await mailboxContract.value!.register();
    await tx.wait();
    await fetchRegistered(wallet.value!);
  } catch (e: any) {
    alert(e.message);
  }
}

onConnect((wallet) => {
  fetchRegistered(wallet);
});

async function fetchRegistered(wallet: ethers.Wallet) {
  const event = await getRegisteredEvent(
    mailboxContract.value!,
    wallet.address
  );

  isRegistered.value = !!event;
}
</script>

<template lang="pug">
header.daisy-navbar.border-b
  .daisy-navbar-start
    h1.font-semibold.uppercase Chainmsg
  .daisy-navbar-center
  .daisy-navbar-end.flex.gap-2
    template(v-if="wallet")
      PFP.h-8.w-8.shrink-0(:address="wallet.address" :key="wallet.address")
      span {{ wallet.address.slice(0, 6) + "..." + wallet.address.slice(-4) }}
      template(v-if="isRegistered === undefined")
        button.daisy-btn-primary.daisy-btn.cursor-wait(disabled)
          Spinner.h-5.w-5.animate-spin.fill-white.text-base-content
      template(v-else-if="!isRegistered")
        button.daisy-btn-primary.daisy-btn(@click="register") Register
      button.daisy-btn(@click="logout") Logout
    template(v-else)
      button.daisy-btn-primary.daisy-btn(@click="login") Login
</template>
