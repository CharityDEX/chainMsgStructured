import { markRaw, ref, Ref } from "vue";
import { ethers } from "ethers";
import { Mailbox, Mailbox__factory } from "contracts/typechain";
import config from "./config";
import { useStorage } from "@vueuse/core";

const secretStorage = useStorage("secret", "", sessionStorage);

export const wallet: Ref<ethers.Wallet | null> = ref(null);
export const mailboxContract: Ref<Mailbox | null> = ref(null);

export function tryConnect() {
  if (secretStorage.value) {
    connect(secretStorage.value);
  }
}

export async function connect(secret: string) {
  console.debug("Connecting to Ethereum node " + config.eth.rpcUrl.toString());
  const provider = new ethers.providers.JsonRpcProvider(
    config.eth.rpcUrl.toString()
  );

  await provider.ready;
  console.info("Connected to Ethereum node " + config.eth.rpcUrl.toString());

  wallet.value = markRaw(new ethers.Wallet(secret, provider));
  wallet.value.connect(provider);
  console.info("Connected to Ethereum wallet " + wallet.value.address);

  mailboxContract.value = markRaw(
    Mailbox__factory.connect(config.eth.mailboxAddress, wallet.value)
  );

  secretStorage.value = secret;

  fireOnConnectCallbacks();
}

export const disconnect = () => {
  secretStorage.value = "";
  wallet.value = null;
  mailboxContract.value = null;
  fireOnDisconnectCallbacks();
};

export function onConnect(
  callback: (wallet: ethers.Wallet, isReconnect: boolean) => void
) {
  const obj: OnConnectCallbackWrapper = { callback, cancelled: false };
  const cancel = () => (obj.cancelled = true);

  if (wallet.value) {
    callback(wallet.value, false);
  } else {
    onConnectCallbacks.push(obj);
  }

  return cancel;
}

export function onDisconnect(callback: () => void) {
  const obj: OnDisconnectCallbackWrapper = { callback, cancelled: false };
  const cancel = () => (obj.cancelled = true);
  onDisconnectCallbacks.push(obj);
  return cancel;
}

type OnConnectCallbackWrapper = {
  readonly callback: (wallet: ethers.Wallet, isReconnect: boolean) => void;
  cancelled: boolean;
};

type OnDisconnectCallbackWrapper = {
  readonly callback: () => void;
  cancelled: boolean;
};

const onConnectCallbacks: OnConnectCallbackWrapper[] = [];
const onDisconnectCallbacks: OnDisconnectCallbackWrapper[] = [];

function fireOnConnectCallbacks(isReconnect: boolean = false) {
  let i = onConnectCallbacks.length;

  while (i--) {
    const obj = onConnectCallbacks[i];
    if (!obj.cancelled) obj.callback(wallet.value!, isReconnect);
    onConnectCallbacks.splice(i, 1);
  }
}

function fireOnDisconnectCallbacks() {
  let i = onDisconnectCallbacks.length;

  while (i--) {
    const obj = onDisconnectCallbacks[i];
    if (!obj.cancelled) obj.callback();
    onDisconnectCallbacks.splice(i, 1);
  }
}
