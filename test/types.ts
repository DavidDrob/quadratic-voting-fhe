import type { Counter, QuadraticVoting } from "../types";
import type { FheInstance } from "../utils/instance";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";

type Fixture<T> = () => Promise<T>;

declare module "mocha" {
  export interface Context {
    voter: QuadraticVoting
    instance: FheInstance;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
  }
}

export interface Signers {
  admin: SignerWithAddress;
}
