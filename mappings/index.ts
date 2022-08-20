/* eslint-disable prefer-const */
import { Address, BigDecimal, BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import { Transfer, NFT, Bid, User } from "../generated/schema";
import { Transfer as TransferEvent } from "../generated/ChimpDao/ChimpNFT";
import { onBidPlaced } from "../generated/ChimpAuction/ChimpAuction";

let ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

export function handleTransfer(event: TransferEvent): void {
  let nft: NFT;
  let transfers: string[];

  let transferItem = new Transfer(event.transaction.hash.toHex()!);
  transferItem.from = event.params.from;
  transferItem.to = event.params.to;
  transferItem.timestamp = event.block.timestamp;
  transferItem.save();

  if (event.params.from.toHex() == ADDRESS_ZERO) {
    nft = new NFT(event.params.tokenId.toHex());
    transfers = [transferItem.id];
  } else {
    nft = NFT.load(event.params.tokenId.toHex())!;
    transfers = nft.transfers!;
    transfers.push(transferItem.id);
  }

  if (nft) {
    nft.owner = event.params.to;
    nft.transfers = transfers;

    nft.save();
  }
}

export function handleBidPlaced(event: onBidPlaced): void {
  let bid = new Bid(event.transaction.hash.toHex());
  bid.amount = event.params.param0;
  bid.user = event.transaction.from;
  bid.txn = event.transaction.hash;
  bid.timestamp = event.block.timestamp;
  bid.save();

  let user: User = User.load(event.transaction.from.toHex())!;

  if (user) {
    let bids = user.bids!;
    bids.push(bid.id);
    user.bids = bids;
  } else {
    user = new User(event.transaction.from.toHex());
    user.bids = [bid.id];
    user.totalBidAmount = new BigInt(0);
  }
  user.totalBidAmount = event.params.param0.plus(user.totalBidAmount);
  user.save();
}
