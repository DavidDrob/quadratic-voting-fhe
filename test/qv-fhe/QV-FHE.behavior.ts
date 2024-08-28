import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "hardhat";

export function shouldBehaveLikeVoter(): void {
  it("should set the owner", async function () {
    const owner = await this.voter.owner();

    expect(owner != "0x0000000000000000000000000000000000000000");
  });
  it("owner can create voting", async function () {
    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);

    const start = block?.timestamp as number;
    const end = start + (7 * 24 * 60 * 60);
    const options = 5;

    this.voter.connect(this.signers.admin);
    await this.voter.createVoting(start, end, options);

    const voting = await this.voter.votings(0);
    
    expect(voting.id === BigInt(0));
    expect(voting.startDate === BigInt(start));
    expect(voting.endDate === BigInt(end));
    expect(voting.endDate > start);
  });
  it("user can vote", async function () {
    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);

    const start = block?.timestamp as number;
    const end = start + (7 * 24 * 60 * 60);
    const options = 5;

    this.voter.connect(this.signers.admin);
    await this.voter.createVoting(start, end, options);

    const randomUser = (await ethers.getSigners())[0];

    this.mockToken.connect(randomUser);
    this.mockToken.mint(100e6);

    expect((await this.mockToken.balanceOf(randomUser)) != 0);

    const vote1Before = (await this.voter.getOptions(0))[1];

    const vote0 = await this.instance.instance.encrypt_uint64(BigInt(0));
    const vote1 = await this.instance.instance.encrypt_uint64(BigInt(6e6)); // 25
    const vote2 = await this.instance.instance.encrypt_uint64(BigInt(0));
    const vote3 = await this.instance.instance.encrypt_uint64(BigInt(0));
    const vote4 = await this.instance.instance.encrypt_uint64(BigInt(8e6)); // 64

    this.voter.connect(randomUser);
    this.voter.vote("0", [vote0, vote1, vote2, vote3, vote4]);

    expect((await this.voter.getOptions(0))[1] != vote1Before);
  });
}
