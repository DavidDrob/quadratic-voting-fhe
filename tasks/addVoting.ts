import { Counter } from "../types";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("task:addVoting")
  .addParam("amount", "Amount to add to the counter (plaintext number)", "1")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const QVoting = await deployments.get("QuadraticVoting");
    const qvContract = await ethers.getContractAt("QuadraticVoting", QVoting.address);

    const owner = await qvContract.owner();

    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);

    const start = block?.timestamp as number + 335;
    const end = start + (7 * 24 * 60 * 60);
    const options = 5;

    try {
      const ownerSigner = await ethers.getSigner(owner);
      qvContract.connect(ownerSigner);

      await qvContract.createVoting(start, end, options);
    } catch (e) {
      console.log(`Failed to send add transaction: ${e}`);
      return;
    }
  });
