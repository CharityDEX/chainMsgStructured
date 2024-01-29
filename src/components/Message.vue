<script lang="ts">
import CryptoJS from "crypto-js";
import { prettyPrintAddress } from "@/utils";

export class Message {
  readonly decrypted: string;

  constructor(
    public readonly from: string,
    public readonly to: string,
    public readonly payload: string,
    public readonly blockNumber: number,
    public readonly logIndex: number,
    ecdhKey: string
  ) {
    this.decrypted = CryptoJS.AES.decrypt(
      Buffer.from(payload.slice(2), "hex").toString("base64"),
      ecdhKey
    ).toString(CryptoJS.enc.Utf8);
  }
}
</script>

<script setup lang="ts">
import PFP from "./PFP.vue";

const { message, alignRight = false } = defineProps<{
  message: Message;
  alignRight: boolean;
}>();
</script>

<template lang="pug">
.flex.items-end.gap-1(:class="{ 'flex-row-reverse': alignRight }")
  //- PFP.h-8.w-8(:address="message.from" :key="message.from")
  .relative.rounded-xl.border.px-4.py-2(
    :class="alignRight ? 'rounded-br-none bg-green-100' : 'rounded-bl-none '"
  )
    p {{ message.decrypted }}
    //- .absolute.right-2.bottom-2.text-xs.text-gray-300 {{ message.blockNumber }}
</template>
