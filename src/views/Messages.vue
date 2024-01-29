<script lang="ts">
export class Recepient {
  ecdhKey?: string;
  latestMessageBlockNumber?: number;

  constructor(public readonly address: string) {}
}
</script>

<script setup lang="ts">
import { onConnect, mailboxContract } from "@/eth";
import { onMounted, onUnmounted, ref, type ShallowRef } from "vue";
import { useSorted } from "@vueuse/core";
import { type SendMessageEvent } from "contracts/typechain/Mailbox";
import MessageVue, { Message } from "@/components/Message.vue";

const { recepient } = defineProps<{ recepient: Recepient }>();

const messages: ShallowRef<Message[]> = ref([]);
const sortedMessages = useSorted(messages, (a, b) => {
  return a.blockNumber - b.blockNumber;
});

function processEvent(event: SendMessageEvent) {
  const found = messages.value.find(
    (m) => m.blockNumber === event.blockNumber && m.logIndex === event.logIndex
  );

  if (!found) {
    messages.value.push(
      new Message(
        event.args.from,
        event.args.to,
        event.args.data,
        event.blockNumber,
        event.logIndex,
        recepient.ecdhKey!
      )
    );
  }
}

onMounted(() => {
  const cancel = onConnect((wallet) => {
    const fromMe = mailboxContract.value!.filters.SendMessage(
      wallet.address,
      recepient.address
    );

    const fromPeer = mailboxContract.value!.filters.SendMessage(
      recepient.address,
      wallet.address
    );

    mailboxContract.value!.queryFilter(fromMe).then((events) => {
      events.forEach(processEvent);
    });

    mailboxContract.value!.queryFilter(fromPeer).then((events) => {
      events.forEach(processEvent);
    });

    mailboxContract.value!.on(fromMe, (_a, _b, _c, event) => {
      processEvent(event);
    });

    mailboxContract.value!.on(fromPeer, (_a, _b, _c, event) => {
      processEvent(event);
    });
  });

  onUnmounted(() => {
    cancel();
    mailboxContract.value!.removeAllListeners("SendMessage");
  });
});
</script>

<template lang="pug">
MessageVue(
  v-for="message in sortedMessages"
  :message="message"
  :align-right="message.to === recepient.address"
)
</template>
