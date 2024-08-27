import type { QuadraticVoting } from "../../types";
import hre from "hardhat";
import { ethers } from "hardhat";

export async function deployVoterFixture(): Promise<{
  voter: QuadraticVoting;
  address: string;
}> {
  const accounts = await hre.ethers.getSigners();
  const contractOwner = accounts[0];

  // Deploy mock ERC-20 contract
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockERC20 = await MockERC20.deploy(10000000000);
  await mockERC20.waitForDeployment();
  const mockERC20Address = await mockERC20.getAddress();

  const Voter = await hre.ethers.getContractFactory("QuadraticVoting");
  const voter = await Voter.connect(contractOwner).deploy(mockERC20Address);
  await voter.waitForDeployment();
  const address = await voter.getAddress();
  return { voter, address };
}

export async function getTokensFromFaucet() {
  if (hre.network.name === "localfhenix") {
    const signers = await hre.ethers.getSigners();

    if (
      (await hre.ethers.provider.getBalance(signers[0].address)).toString() ===
      "0"
    ) {
      await hre.fhenixjs.getFunds(signers[0].address);
    }
  }
}
