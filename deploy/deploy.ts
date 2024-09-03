import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import chalk from "chalk";

const hre = require("hardhat");

const func: DeployFunction = async function () {
  const { fhenixjs, ethers } = hre;
  const { deploy } = hre.deployments;
  const [signer] = await ethers.getSigners();

  if ((await ethers.provider.getBalance(signer.address)).toString() === "0") {
    if (hre.network.name === "localfhenix") {
      await fhenixjs.getFunds(signer.address);
    } else {
        console.log(
            chalk.red("Please fund your account with testnet FHE from https://faucet.fhenix.zone"));
        return;
    }
  }

  const mockToken = await deploy("MockERC20", {
    from: signer.address,
    args: [1_000_000],
    log: true,
    skipIfAlreadyDeployed: false,
  });

  const qvContract = await deploy("QuadraticVoting", {
    from: signer.address,
    args: [mockToken.address],
    log: true,
    skipIfAlreadyDeployed: false,
  });

  const counter = await deploy("Counter", {
    from: signer.address,
    args: [],
    log: true,
    skipIfAlreadyDeployed: false,
  });

  console.log(`Counter contract: `, counter.address);
  console.log(`Mock Token contract: `, mockToken.address);
  console.log(`QV contract: `, qvContract.address);
};

export default func;
func.id = "deploy_counter";
func.tags = ["Counter"];
