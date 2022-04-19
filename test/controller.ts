/* eslint-disable import/first */
/* eslint-disable node/no-unsupported-features/es-builtins */
import fetch, { Headers, Request, Response } from "node-fetch";

if (!(globalThis as any).fetch) {
  (globalThis as any).fetch = fetch;
  (globalThis as any).Headers = Headers;
  (globalThis as any).Request = Request;
  (globalThis as any).Response = Response;
}

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, BigNumberish } from "ethers";
import { ethers } from "hardhat";
import { Badges, BadgesController, Rigs, TablelandTables } from "../typechain";
import { connect, ConnectionOptions } from "@tableland/sdk";

describe("Controller", function () {
  const registryAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const validatorHost = "http://localhost:8080";

  let accounts: SignerWithAddress[];
  let registry: TablelandTables;
  let rigs: Rigs;
  let badges: Badges;
  let controller: BadgesController;

  const runSQLAndReturnEvent = async (
    account: SignerWithAddress,
    tokenId: BigNumberish,
    query: string
  ): Promise<any> => {
    const tx = await registry
      .connect(account)
      .runSQL(account.address, tokenId, query);
    const receipt = await tx.wait();
    const [event] = receipt.events ?? [];
    return event.args;
  };

  before(async function () {
    accounts = await ethers.getSigners();

    // Get deployed registry
    const TT = await ethers.getContractFactory("TablelandTables");
    registry = TT.attach(registryAddress);

    // Deploy rigs
    const R = await ethers.getContractFactory("Rigs");
    rigs = await R.deploy();
    await rigs.deployed();

    // Deploy badges
    const B = await ethers.getContractFactory("Badges");
    badges = await B.deploy();
    await badges.deployed();

    // Deploy badges controller
    const C = await ethers.getContractFactory("BadgesController");
    controller = await C.deploy();
    await controller.deployed();

    // Set rigs on badges controller
    let tx = await controller.setRigs(rigs.address);
    await tx.wait();

    // Set badges on badges controller
    tx = await controller.setBadges(badges.address);
    await tx.wait();
  });

  it("Create mutable relational metadata", async function () {
    this.timeout(60000);

    const owner = accounts[1];
    const user1 = accounts[2];
    const user2 = accounts[3];

    // Make the tables (mint and create)
    const options: ConnectionOptions = {
      signer: owner,
      contract: registryAddress,
      host: validatorHost,
    };
    const tbl = await connect(options);
    let res = await tbl.create(
      `create table rigs (
        id int primary key,
        fleet varchar not null check (fleet in ('a', 'b', 'c')),
        chassis varchar not null check (chassis in ('a', 'b', 'c')),
        wheels varchar not null check (wheels in ('a', 'b', 'c')),
        background varchar not null check (background in ('a', 'b', 'c')),
        image varchar not null
      );`,
      { description: "rigs metadata" }
    );
    const rigsTableName = res.name;
    console.log("Rigs name:", rigsTableName);
    const rigsTokenId = BigNumber.from(rigsTableName.replace("rigs_", ""));
    res = await tbl.create(
      `create table badges (
        id int primary key,
        rig_id int references ${rigsTableName.replace("rigs", "")},
        name varchar not null,
        image varchar not null,
        position int not null check (position >= 0 and position < 8),
        unique (rig_id, name)
      );`,
      { description: "badges metadata" }
    );
    const badgesTableName = res.name;
    console.log("Badges name:", badgesTableName);
    const badgesTokenId = BigNumber.from(
      badgesTableName.replace("badges_", "")
    );

    // Insert some rigs
    await runSQLAndReturnEvent(
      owner,
      rigsTokenId,
      `insert into ${rigsTableName} values (0, 'a', 'b', 'c', 'b', 'ipfs://bafybeibb3ogzqpge6goyyz2dvjla33odbl2yia4qwa6i774fof525y5rja');`
    );
    await runSQLAndReturnEvent(
      owner,
      rigsTokenId,
      `insert into ${rigsTableName} values (1, 'b', 'a', 'a', 'c', 'ipfs://bafybeibb3ogzqpge6goyyz2dvjla33odbl2yia4qwa6i774fof525y5rja');`
    );

    // Insert some badges
    await runSQLAndReturnEvent(
      owner,
      badgesTokenId,
      `insert into ${badgesTableName} values (0, 0, 'Summer Cohort', 'ipfs://QmV4cQWhZtn9gZfzUbQouywb8MA9uxEtvHW8fhxkPxZ2uk', 0);`
    );
    await runSQLAndReturnEvent(
      owner,
      badgesTokenId,
      `insert into ${badgesTableName} values (1, 1, 'Summer Cohort', 'ipfs://QmV4cQWhZtn9gZfzUbQouywb8MA9uxEtvHW8fhxkPxZ2uk', 0);`
    );
    await runSQLAndReturnEvent(
      owner,
      badgesTokenId,
      `insert into ${badgesTableName} values (2, 0, 'Validator', 'ipfs://Qmf9e4DjpFNszeck45P6sdHNu8R1Es5FRAPgHUFXfhwtXs', 0);`
    );

    // Set badges controller
    let tx = await registry
      .connect(owner)
      .setController(owner.address, badgesTokenId, controller.address);
    await tx.wait();

    // Mint rigs
    tx = await rigs.safeMint(user1.address);
    const receipt = await tx.wait();
    const [mint] = receipt.events ?? [];
    const rig1TokenId = mint.args?.tokenId;
    tx = await rigs.safeMint(user2.address);
    await tx.wait();

    // Mint badges
    tx = await badges.safeMint(user1.address);
    await tx.wait();
    tx = await badges.safeMint(user2.address);
    await tx.wait();
    tx = await badges.safeMint(user1.address);
    await tx.wait();

    // User updates their Rig by setting Badge metadata
    let event = await runSQLAndReturnEvent(
      user1,
      badgesTokenId,
      `update ${badgesTableName} set position = 1 where id = 0;`
    );
    console.log("badge policy", event.policy);
    event = await runSQLAndReturnEvent(
      user1,
      badgesTokenId,
      `update ${badgesTableName} set position = 2 where id = 2;`
    );
    console.log("badge policy", event.policy);

    // Log inserted rows
    let q = await tbl.query(`select * from ${rigsTableName};`);
    console.log("Rigs:");
    logJSON(q);
    q = await tbl.query(`select * from ${badgesTableName};`);
    console.log("Badges:");
    logJSON(q);

    // Get rig1 metadata
    const tokenUri = await rigs.tokenURI(rig1TokenId);
    console.log(tokenUri);
  });
});

const logJSON = (obj: any) => {
  return JSON.stringify(obj, null, 2);
};
