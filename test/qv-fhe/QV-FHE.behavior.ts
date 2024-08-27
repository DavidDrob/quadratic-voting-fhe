import { expect } from "chai";
import hre from "hardhat";

export function shouldBehaveLikeVoter(): void {
  it("should set the owner", async function () {
    const owner = await this.voter.owner();

    expect(owner != "0x0000000000000000000000000000000000000000");
  });
}
