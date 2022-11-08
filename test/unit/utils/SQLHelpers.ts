import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { TestSQLHelpers } from "../../../typechain-types";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("SQLHelpers", function () {
  let lib: TestSQLHelpers;
  beforeEach(async function () {
    const Lib = await ethers.getContractFactory("TestSQLHelpers");
    lib = (await Lib.deploy()) as TestSQLHelpers;
    await lib.deployed();
  });

  it("Should return a name from a prefix", async function () {
    expect(
      // This is not a valid name in Tableland but tests string concat.
      await lib.toNameFromId("_test_&$%()#@!*_123__", 101)
    ).to.equal("_test_&$%()#@!*_123___31337_101");
  });

  it("Should return a valid CREATE statement from schema", async function () {
    expect(
      // This is not a valid name in Tableland but tests string concat.
      await lib.toCreateFromSchema("id int,name text,desc text", "test_101")
    ).to.equal("CREATE TABLE test_101_31337(id int,name text,desc text)");
  });

  it("Should return a valid INSERT statement from columns and values", async function () {
    expect(
      // This is not a valid name in Tableland but tests string concat.
      await lib.toInsert(
        "test_101",
        1,
        "id,name,desc",
        "2,'test','information'"
      )
    ).to.equal(
      "INSERT INTO test_101_31337_1(id,name,desc)VALUES(2,'test','information')"
    );
  });

  it("Should return a valid INSERT statement from columns and an array of values", async function () {
    expect(
      // This is not a valid name in Tableland but tests string concat.
      await lib.toBatchInsert("test_101", 1, "id,name,desc", [
        "1,'hello','information'",
        "2,'world','information'",
      ])
    ).to.equal(
      "INSERT INTO test_101_31337_1(id,name,desc)VALUES(1,'hello','information'),(2,'world','information')"
    );
  });

  it("Should return a valid UPDATE statement from columns, setters, and filters", async function () {
    expect(
      // This is not a valid name in Tableland but tests string concat.
      await lib.toUpdate(
        "test_101",
        1,
        "name='update_test',desc='updated!'",
        "id=2"
      )
    ).to.equal(
      "UPDATE test_101_31337_1 SET name='update_test',desc='updated!' WHERE id=2"
    );
  });

  it("Should return a valid UPDATE statement from columns and setters", async function () {
    expect(
      // This is not a valid name in Tableland but tests string concat.
      await lib.toUpdate(
        "test_101",
        1,
        "name='update_all_test',desc='updated!'",
        ""
      )
    ).to.equal(
      "UPDATE test_101_31337_1 SET name='update_all_test',desc='updated!'"
    );
  });

  it("Should return a valid DELETE statement from filters", async function () {
    expect(
      // This is not a valid name in Tableland but tests string concat.
      await lib.toDelete("test_101", 1, "id=2")
    ).to.equal("DELETE FROM test_101_31337_1 WHERE id=2");
  });

  it("Should return a single-quote wrapped string", async function () {
    expect(
      // This is not a valid name in Tableland but tests string concat.
      await lib.quote("hello")
    ).to.equal("'hello'");
  });
});
