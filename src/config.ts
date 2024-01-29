class Eth {
  constructor(
    public readonly rpcUrl: URL,
    public readonly mailboxAddress: string
  ) {}
}

class Config {
  constructor(public readonly eth: Eth) {}
}

export default new Config(
  new Eth(
    new URL(import.meta.env.VITE_ETH_RPC_URL),
    import.meta.env.VITE_ETH_MAILBOX_ADDRESS
  )
);
