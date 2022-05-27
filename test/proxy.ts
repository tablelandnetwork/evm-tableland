// import { expect } from "chai";
// import { ethers, upgrades } from "hardhat";
// import { BigNumber } from "ethers";
// import type { TablelandTables } from "../typechain/index";

// describe("Proxy", function () {
//   it("Should be callable from deployed proxy contract", async function () {
//     const Factory = await ethers.getContractFactory("TablelandTables");

//     const registry = (await upgrades.deployProxy(
//       Factory,
//       ["https://fake.com/"],
//       {
//         kind: "uups",
//       }
//     )) as TablelandTables;
//     await registry.deployed();

//     const totalSupply = await registry.totalSupply();
//     expect(0).to.equal(Number(totalSupply.toString()));
//   });

//   it("Should be able to deploy multi proxy contracts with different baseURI", async function () {
//     const [account] = await ethers.getSigners();
//     const Factory = await ethers.getContractFactory("TablelandTables");

//     const reg1 = (await upgrades.deployProxy(Factory, ["https://one.com/"], {
//       kind: "uups",
//     })) as TablelandTables;
//     await reg1.deployed();

//     const reg2 = (await upgrades.deployProxy(Factory, ["https://two.com/"], {
//       kind: "uups",
//     })) as TablelandTables;
//     await reg2.deployed();

//     expect(reg1.address).to.not.equal(reg2.address);
//     const totalSupply = await reg1.totalSupply();
//     expect(0).to.equal(Number(totalSupply.toString()));

//     const createStatement = "create table contract_test_hardhat (int a);";
//     const tx = await reg1.createTable(account.address, createStatement);
//     await tx.wait();

//     const tokenURI = await reg1.tokenURI(0);
//     expect(tokenURI).to.include("https://one.com/");
//   });

//   it("Should allow admin calls to proxy contract for runSQL", async function () {
//     const [admin, owner] = await ethers.getSigners();
//     const Factory = await ethers.getContractFactory("TablelandTables");

//     const registry = (await upgrades.deployProxy(
//       Factory,
//       ["https://fake.com/"],
//       {
//         kind: "uups",
//       }
//     )) as TablelandTables;
//     await registry.deployed();

//     const createStatement = "create table contract_test_hardhat (int a);";
//     const tx = await registry
//       .connect(owner)
//       .createTable(owner.address, createStatement);
//     const receipt = await tx.wait();

//     const [, createEvent] = receipt.events ?? [];
//     const tableId = createEvent.args!.tableId;

//     expect(tableId).to.equal(BigNumber.from(0));

//     const insertStatement = "insert into contract_test_insert_hardhat";

//     const updateTx = await registry
//       .connect(admin)
//       .runSQL(owner.address, tableId, insertStatement);

//     const update = await updateTx.wait();

//     const [insertEvent] = update.events ?? [];

//     expect(insertEvent.args!.caller).to.equal(owner.address);
//   });
// });
