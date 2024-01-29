import { Mailbox } from "contracts/typechain";
import { ethers } from "ethers";

export async function getRegisteredEvent(
  contract: Mailbox,
  address: string
): Promise<ethers.Event | undefined> {
  const event = (
    await contract.queryFilter(contract.filters.Register(address))
  )[0];

  return event;
}
