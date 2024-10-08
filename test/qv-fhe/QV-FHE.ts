import { createFheInstance } from "../../utils/instance";
import type { Signers } from "../types";
import { shouldBehaveLikeVoter } from "./QV-FHE.behavior.ts";
import { deployVoterFixture, getTokensFromFaucet } from "./QV-FHE.fixture";
import hre from "hardhat";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    // get tokens from faucet if we're on localfhenix and don't have a balance
    await getTokensFromFaucet();
    // deploy test contract
    const { voter, address, mockToken, owner } = await deployVoterFixture();
    this.voter = voter;
    this.mockToken = mockToken;

    // initiate fhenixjs
    this.instance = await createFheInstance(hre, address);

    // set admin account/signer
    const signers = await hre.ethers.getSigners();
    this.signers.admin = owner;
  });

  describe("Voter", function () {
    shouldBehaveLikeVoter();
  });
});
