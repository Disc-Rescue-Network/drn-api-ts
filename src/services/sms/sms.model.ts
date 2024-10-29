export const OPT_IN_KEYWORDS: string[] = [
  "start",
  "disc",
  "claim",
  "unstop",
] as const;
export const OPT_OUT_KEYWORDS: string[] = ["cancel", "stop"] as const;

export const optInMessage = `Disc Rescue Network (DRN): We’ve found your disc! Reply "CLAIM" to consent to receive text updates about your disc, including claim instructions. Msg&Data rates may apply. Reply "STOP" to opt-out.`;

export const formatClaimInventoryMessage = (
  unclaimedInventoryLength: number
) => {
  const discsWord = unclaimedInventoryLength > 1 ? "discs" : "disc";
  return unclaimedInventoryLength > 0
    ? `Disc Rescue Network (DRN): You have ${unclaimedInventoryLength} ${discsWord} waiting to be claimed. Claim your ${discsWord}: https://app.discrescuenetwork.com`
    : `Disc Rescue Network (DRN): We do not have any discs in the system with your phone number, however, at any time you can visit https://app.discrescuenetwork.com to search the inventory for your lost plastic. Additionally, if any show up in the network, we will let you know.`;
};
