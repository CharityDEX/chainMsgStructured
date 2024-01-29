<script setup lang="ts">
import { PencilSquareIcon, PaperAirplaneIcon } from "@heroicons/vue/24/outline";
import { computed, onMounted, ref, type Ref } from "vue";
import { ethers } from "ethers";
import { mailboxContract, onConnect, wallet } from "@/eth";
import { recover } from "@/eth/utils";
import { getRegisteredEvent } from "@/eth/mailbox";
import CryptoJS from "crypto-js";
import Messages, { Recepient } from "./Messages.vue";
import { useSorted } from "@vueuse/core";
import PFP from "@/components/PFP.vue";
import { prettyPrintAddress } from "@/utils";
import Spinner from "@/components/Spinner.vue";

class AddressNotRegisteredError extends Error {
  constructor(public readonly address: string) {
    super("Address not registered: " + address);
  }
}

const recepientsMap: Record<string, Recepient> = {};
const recepientsArray: Ref<Recepient[]> = ref([]);

// TODO: Sorting doesn't work properly.
const recepientsArraySorted = useSorted(recepientsArray, (a, b) => {
  return (b.latestMessageBlockNumber || 0) - (a.latestMessageBlockNumber || 0);
});

const loadingFrom = ref(true);
const loadingTo = ref(true);

const searchInput = ref("");

const selectedRecepient: Ref<Recepient | null> = ref(null);
const message = ref("");
const sendingMessage = ref(false);

const canSend = computed(() => {
  return (
    selectedRecepient.value && message.value && message.value.trim() !== ""
  );
});

async function selectRecepient() {
  if (!ethers.utils.isAddress(searchInput.value)) {
    alert("Invalid address: " + searchInput.value);
    return;
  }

  try {
    selectedRecepient.value = await getOrCreateRecepient(searchInput.value);
  } catch (e) {
    if (e instanceof AddressNotRegisteredError) {
      alert("Address not registered: " + e.address);
    } else {
      throw e;
    }
  }

  searchInput.value = "";
}

async function sendMessage() {
  if (!selectedRecepient.value) {
    alert("Please select a recepient");
    return;
  }

  const msg = message.value.trim();

  if (!msg || msg.length === 0) {
    alert("Please enter a message");
    return;
  }

  message.value = "";
  sendingMessage.value = true;

  const encrypted = CryptoJS.AES.encrypt(msg, selectedRecepient.value.ecdhKey!);
  const payload = Buffer.from(encrypted.toString(), "base64");
  console.debug("Encrypted message", encrypted.toString(), payload);

  const tx = await mailboxContract.value?.sendMessage(
    selectedRecepient.value.address,
    payload
  );
  console.log("Send message tx", tx);
  const receipt = await tx!.wait();
  console.log("Message sent", receipt);

  sendingMessage.value = false;
}

async function getOrCreateRecepient(address: string): Promise<Recepient> {
  let found = recepientsMap[address];

  if (!found) {
    const recepient = new Recepient(address);

    recepientsMap[address] = recepient;

    const event = await getRegisteredEvent(mailboxContract.value!, address);

    if (!event) {
      delete recepientsMap[address];
      throw new AddressNotRegisteredError(address);
    }

    const recovered = await recover(await event.getTransaction());
    console.debug("Recovered", recovered);

    const signingKey = new ethers.utils.SigningKey(wallet.value!.privateKey);
    recepient.ecdhKey = signingKey.computeSharedSecret(recovered.publicKey);

    recepientsArray.value.push(recepient);
    found = recepient;
  }

  return found;
}

onMounted(() => {
  onConnect((wallet) => {
    const from = mailboxContract.value!.filters.SendMessage(wallet.address);
    const to = mailboxContract.value!.filters.SendMessage(null, wallet.address);

    mailboxContract.value!.queryFilter(from).then((events) => {
      const promises = [];

      for (const event of events) {
        promises.push(
          getOrCreateRecepient(event.args.to).then((recepient) => {
            recepient.latestMessageBlockNumber = Math.max(
              recepient.latestMessageBlockNumber || 0,
              event.blockNumber
            );
          })
        );
      }

      Promise.all(promises).then(() => {
        loadingFrom.value = false;
      });
    });

    mailboxContract.value!.queryFilter(to).then((events) => {
      const promises = [];

      for (const event of events) {
        promises.push(
          getOrCreateRecepient(event.args.from).then((recepient) => {
            recepient.latestMessageBlockNumber = Math.max(
              recepient.latestMessageBlockNumber || 0,
              event.blockNumber
            );
          })
        );
      }

      Promise.all(promises).then(() => {
        loadingTo.value = false;
      });
    });
  });
});
</script>

<template lang="pug">
.grid.h-full.w-full.bg-base-300(
  style="grid-template-columns: minmax(10rem, 20rem) 1fr; grid-template-rows: min-content auto; gap: 1px"
)
  .flex.items-center.gap-2.bg-base-100.p-4
    input.daisy-input-bordered.daisy-input.daisy-input-sm.grow(
      v-model="searchInput"
      type="text"
      placeholder="Address"
    )
    .daisy-btn-primary.daisy-btn-square.daisy-btn-sm.daisy-btn.p-1(
      @click="selectRecepient"
    )
      PencilSquareIcon

  .flex.items-center.bg-base-100.p-4
    template(v-if="selectedRecepient")
      .flex.items-center.gap-2
        span.font-semibold To:
        PFP.h-6.w-6(
          :address="selectedRecepient.address"
          :key="selectedRecepient.address"
        )
        span.text-gray-500 {{ selectedRecepient.address }}
    template(v-else)
      span.text-gray-500 Please select a recepient

  .bg-base-100
    template(v-if="recepientsArraySorted.length > 0")
      ul
        li.flex.cursor-pointer.items-center.gap-2.p-2.hover_bg-base-200(
          v-for="recepient in recepientsArraySorted"
          :key="recepient.address"
          @click="selectedRecepient = recepient"
          :class="{ 'bg-base-200': selectedRecepient?.address === recepient.address }"
        )
          PFP.h-10.w-10(:address="recepient.address")
          span.text-gray-500 {{ prettyPrintAddress(recepient.address) }}
          //- span.text-sm.text-gray-500 {{ recepient.latestMessageBlockNumber }}
    template(v-else-if="loadingFrom || loadingTo")
      .flex.flex-col.items-center.justify-center.p-4
        Spinner.h-5.w-5.animate-spin.text-base-content
    template(v-else)
      .flex.h-full.flex-col.items-center.justify-center.p-4
        span.text-gray-500 No messages yet

  .flex.flex-col.bg-base-100
    template(v-if="selectedRecepient")
      .flex.flex-col.gap-2.p-4
        Messages(
          :recepient="selectedRecepient"
          :key="selectedRecepient.address"
        )
      .flex.gap-2.border-t.p-4
        textarea.daisy-textarea-bordered.daisy-textarea.grow(
          v-model="message"
          type="text"
          placeholder="Message"
        )
        button.daisy-btn-primary.daisy-btn-square.daisy-btn.p-2(
          @click="sendMessage"
          :disabled="!canSend || sendingMessage"
        )
          Spinner.h-full.w-full.animate-spin.fill-white.text-base-content(
            v-if="sendingMessage"
          )
          PaperAirplaneIcon(v-else)
</template>
