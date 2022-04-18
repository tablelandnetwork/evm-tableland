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
  const registryAddress = "0x8A93d247134d91e0de6f96547cB0204e5BE8e5D8";
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

    const TT = await ethers.getContractFactory("TablelandTables");
    registry = TT.attach(registryAddress);

    const R = await ethers.getContractFactory("Rigs");
    rigs = await R.deploy();
    await rigs.deployed();

    const B = await ethers.getContractFactory("Badges");
    badges = await B.deploy();
    await badges.deployed();

    const C = await ethers.getContractFactory("BadgesController");
    controller = await C.deploy();
    await controller.deployed();

    const tx = await controller.setRigs(rigs.address);
    await tx.wait();
  });

  it("Create mutable relational metadata", async function () {
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
    const badgesTokenId = BigNumber.from(
      badgesTableName.replace("badges_", "")
    );

    // Insert some rigs
    let event = await runSQLAndReturnEvent(
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

    let q = await tbl.query(`select * from ${rigsTableName};`);
    console.log(q?.rows);

    // Set badges controller
    let tx = await registry
      .connect(owner)
      .setController(owner.address, badgesTokenId, controller.address);
    await tx.wait();

    // Mint rigs
    tx = await rigs.safeMint(user1.address);
    await tx.wait();
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
    event = await runSQLAndReturnEvent(
      user1,
      badgesTokenId,
      `update ${badgesTableName} set position = 1 where id = 0; update ${badgesTableName} set position = 2 where id = 2;`
    );
    console.log(event);

    q = await tbl.query(`select * from ${badgesTableName};`);
    console.log(q?.rows);
  });
});
