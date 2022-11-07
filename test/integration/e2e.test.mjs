import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { connect } from "@tableland/sdk";
import { LocalTableland, getAccounts } from "@tableland/local";

chai.use(chaiAsPromised);
const expect = chai.expect;
const lt = new LocalTableland({ silent: true });
const accounts = getAccounts();

describe("Validator, Chain, and SDK work end to end", function () {
  // These tests take a bit longer than normal since we are running them against an actual network
  this.timeout(20000);

  before(async function () {
    lt.start();
    await lt.isReady();
  });

  after(async function () {
    await lt.shutdown();
  });

  it("Creates a table that can be read from", async function () {
    const signer = accounts[1];
    const tableland = connect({
      signer,
      chain: "local-tableland",
    });

    const prefix = "test_create_read";
    // `key` is a reserved word in sqlite
    const { tableId } = await tableland.create("keyy TEXT, val TEXT", {
      prefix,
    });

    const chainId = 31337;

    const data = await tableland.read(
      `SELECT * FROM ${prefix}_${chainId}_${tableId};`
    );
    expect(data.rows).to.eql([]);
  });

  it("Create a table that can be written to", async function () {
    const signer = accounts[1];

    const tableland = connect({
      signer,
      chain: "local-tableland",
    });

    const prefix = "test_create_write";
    const { tableId } = await tableland.create("keyy TEXT, val TEXT", {
      prefix,
    });

    const chainId = 31337;
    const queryableName = `${prefix}_${chainId}_${tableId}`;

    const writeRes = await tableland.write(
      `INSERT INTO ${queryableName} (keyy, val) VALUES ('tree', 'aspen')`
    );

    const data = await tableland.read(`SELECT * FROM ${queryableName};`);

    expect(typeof writeRes.hash).to.eql("string");
    expect(data.rows).to.eql([["tree", "aspen"]]);
  });

  it("Table cannot be written to unless caller is allowed", async function () {
    const signer = accounts[1];

    const tableland = connect({
      signer,
      chain: "local-tableland",
    });

    const prefix = "test_not_allowed";
    const { tableId } = await tableland.create("keyy TEXT, val TEXT", {
      prefix,
    });

    const chainId = 31337;
    const queryableName = `${prefix}_${chainId}_${tableId}`;

    const data = await tableland.read(`SELECT * FROM ${queryableName};`);
    expect(data.rows).to.eql([]);

    const signer2 = accounts[2];
    const tableland2 = connect({
      signer2,
      chain: "local-tableland",
    });

    await expect(
      (async function () {
        await tableland2.write(
          `INSERT INTO ${queryableName} (keyy, val) VALUES ('tree', 'aspen')`
        );
      })()
    ).to.be.rejectedWith(
      "db query execution failed (code: ACL, msg: not enough privileges)"
    );

    const data2 = await tableland2.read(`SELECT * FROM ${queryableName};`);
    expect(data2.rows).to.eql([]);
  });

  it("Create a table can have a row deleted", async function () {
    const signer = accounts[1];

    const tableland = connect({
      signer,
      chain: "local-tableland",
    });

    const prefix = "test_create_delete";
    const { tableId } = await tableland.create("keyy TEXT, val TEXT", {
      prefix,
    });

    const chainId = 31337;
    const queryableName = `${prefix}_${chainId}_${tableId}`;

    const write1 = await tableland.write(
      `INSERT INTO ${queryableName} (keyy, val) VALUES ('tree', 'aspen')`
    );

    expect(typeof write1.hash).to.eql("string");

    const write2 = await tableland.write(
      `INSERT INTO ${queryableName} (keyy, val) VALUES ('tree', 'pine')`
    );

    expect(typeof write2.hash).to.eql("string");

    const data = await tableland.read(`SELECT * FROM ${queryableName};`);
    expect(data.rows.length).to.eql(2);

    const delete1 = await tableland.write(
      `DELETE FROM ${queryableName} WHERE val = 'pine';`
    );

    expect(typeof delete1.hash).to.eql("string");

    const data2 = await tableland.read(`SELECT * FROM ${queryableName};`);
    await expect(data2.rows.length).to.eql(1);
  }, 30000);

  it("Read a table with `table` output", async function () {
    const signer = accounts[1];

    const tableland = connect({
      signer,
      chain: "local-tableland",
    });

    const prefix = "test_read";
    const { tableId } = await tableland.create("keyy TEXT, val TEXT", {
      prefix,
    });

    const chainId = 31337;
    const queryableName = `${prefix}_${chainId}_${tableId}`;

    await tableland.write(
      `INSERT INTO ${queryableName} (keyy, val) VALUES ('tree', 'aspen')`
    );

    const data = await tableland.read(`SELECT * FROM ${queryableName};`, {
      output: "table",
    });

    expect(data.columns).to.eql([{ name: "keyy" }, { name: "val" }]);
    expect(data.rows).to.eql([["tree", "aspen"]]);
  });

  it("Read a table with `objects` output", async function () {
    const signer = accounts[1];

    const tableland = connect({
      signer,
      chain: "local-tableland",
    });

    const prefix = "test_read";
    const { tableId } = await tableland.create("keyy TEXT, val TEXT", {
      prefix,
    });

    const chainId = 31337;
    const queryableName = `${prefix}_${chainId}_${tableId}`;

    await tableland.write(
      `INSERT INTO ${queryableName} (keyy, val) VALUES ('tree', 'aspen')`
    );

    const data = await tableland.read(`SELECT * FROM ${queryableName};`, {
      output: "objects",
    });

    expect(data).to.eql([{ keyy: "tree", val: "aspen" }]);
  });

  it("Read a single row with `unwrap` option", async function () {
    const signer = accounts[1];

    const tableland = connect({
      signer,
      chain: "local-tableland",
    });

    const prefix = "test_read";
    const { tableId } = await tableland.create("keyy TEXT, val TEXT", {
      prefix,
    });

    const chainId = 31337;
    const queryableName = `${prefix}_${chainId}_${tableId}`;

    await tableland.write(
      `INSERT INTO ${queryableName} (keyy, val) VALUES ('tree', 'aspen')`
    );

    const data = await tableland.read(`SELECT * FROM ${queryableName};`, {
      unwrap: true,
      output: "objects",
    });

    expect(data).to.eql({ keyy: "tree", val: "aspen" });
  });

  it("Read two rows with `unwrap` option fails", async function () {
    const signer = accounts[1];

    const tableland = connect({
      signer,
      chain: "local-tableland",
    });

    const prefix = "test_read";
    const { tableId } = await tableland.create("keyy TEXT, val TEXT", {
      prefix,
    });

    const chainId = 31337;
    const queryableName = `${prefix}_${chainId}_${tableId}`;

    await tableland.write(
      `INSERT INTO ${queryableName} (keyy, val) VALUES ('tree', 'aspen')`
    );
    await tableland.write(
      `INSERT INTO ${queryableName} (keyy, val) VALUES ('tree', 'pine')`
    );

    await expect(
      (async function () {
        await tableland.read(`SELECT * FROM ${queryableName};`, {
          unwrap: true,
          output: "objects",
        });
      })()
    ).to.be.rejectedWith(
      "unwrapped results with more than one row aren't supported in JSON RPC API"
    );
  });

  it("Read with `extract` option", async function () {
    const signer = accounts[1];

    const tableland = connect({
      signer,
      chain: "local-tableland",
    });

    const prefix = "test_read_extract";
    const { tableId } = await tableland.create("val TEXT", {
      prefix,
    });

    const chainId = 31337;
    const queryableName = `${prefix}_${chainId}_${tableId}`;

    await tableland.write(
      `INSERT INTO ${queryableName} (val) VALUES ('aspen')`
    );
    await tableland.write(`INSERT INTO ${queryableName} (val) VALUES ('pine')`);

    const data = await tableland.read(`SELECT * FROM ${queryableName};`, {
      extract: true,
      output: "objects",
    });

    expect(data).to.eql(["aspen", "pine"]);
  });

  it("Read table with two columns with `extract` option fails", async function () {
    const signer = accounts[1];

    const tableland = connect({
      signer,
      chain: "local-tableland",
    });

    const prefix = "test_read";
    const { tableId } = await tableland.create("keyy TEXT, val TEXT", {
      prefix,
    });

    const chainId = 31337;
    const queryableName = `${prefix}_${chainId}_${tableId}`;

    await tableland.write(
      `INSERT INTO ${queryableName} (keyy, val) VALUES ('tree', 'aspen')`
    );

    await expect(
      (async function () {
        await tableland.read(`SELECT * FROM ${queryableName};`, {
          extract: true,
          output: "objects",
        });
      })()
    ).to.be.rejectedWith(
      "can only extract values for result sets with one column but this has 2"
    );
  });

  it("List an account's tables", async function () {
    const signer = accounts[1];

    const tableland = connect({
      signer,
      chain: "local-tableland",
    });

    const prefix = "test_create_list";
    const { tableId } = await tableland.create("keyy TEXT, val TEXT", {
      prefix,
    });

    const chainId = 31337;
    const queryableName = `${prefix}_${chainId}_${tableId}`;

    const tablesMeta = await tableland.list();

    expect(Array.isArray(tablesMeta)).to.eql(true);
    const table = tablesMeta.find((table) => table.name === queryableName);

    expect(typeof table).to.equal("object");
    expect(table.controller).to.eql(accounts[1].address);
  });

  it("write to a table without using the relay", async function () {
    const signer = accounts[1];

    const tableland = connect({
      signer,
      chain: "local-tableland",
      rpcRelay: false
    });

    const prefix = "test_direct_write";
    const { tableId } = await tableland.create("keyy TEXT, val TEXT", {
      prefix,
    });

    const chainId = 31337;
    const queryableName = `${prefix}_${chainId}_${tableId}`;

    const writeRes = await tableland.write(
      `INSERT INTO ${queryableName} (keyy, val) VALUES ('tree', 'aspen')`
    );

    expect(typeof writeRes.hash).to.eql("string");

    const data = await tableland.read(`SELECT * FROM ${queryableName};`);
    expect(data.rows).to.eql([["tree", "aspen"]]);
  });

  it("write without relay statement validates table name prefix", async function () {
    const signer = accounts[1];

    const tableland = connect({
      signer,
      chain: "local-tableland",
      rpcRelay: false
    });

    const prefix = "test_direct_invalid_write";
    await tableland.create("keyy TEXT, val TEXT", { prefix });

    const prefix2 = "test_direct_invalid_write2";
    const { tableId } = await tableland.create("keyy TEXT, val TEXT", {
      prefix: prefix2,
    });

    // both tables owned by the same account
    // the prefix is for the first table, but id is for second table
    const queryableName = `${prefix}_31337_${tableId}`;

    await expect(
      (async function () {
        await tableland.write(
          `INSERT INTO ${queryableName} (keyy, val) VALUES ('tree', 'aspen')`
        );
      })()
    ).to.be.rejectedWith(
      `table prefix doesn't match (exp ${prefix2}, got ${prefix})`
    );
  });

  it("write without relay statement validates table ID", async function () {
    const signer = accounts[1];

    const tableland = connect({
      signer,
      chain: "local-tableland",
      rpcRelay: false
    });

    const prefix = "test_direct_invalid_id_write";
    await tableland.create("keyy TEXT, val TEXT", { prefix });

    // the tableId 0 does not exist since we start with tableId == 1
    const queryableName = `${prefix}_31337_0`;

    await expect(
      (async function () {
        await tableland.write(
          `INSERT INTO ${queryableName} (keyy, val) VALUES ('tree', 'aspen')`
        );
      })()
    ).to.be.rejectedWith(
      `getting table: failed to get the table: sql: no rows in result set`
    );
  });

  it("set controller without relay", async function () {
    const signer = accounts[1];

    const tableland = connect({
      signer,
      chain: "local-tableland",
      rpcRelay: false
    });

    const prefix = "test_create_setcontroller_norelay";
    // `key` is a reserved word in sqlite
    const { name } = await tableland.create("keyy TEXT, val TEXT", { prefix });

    // Set the controller to Hardhat #7
    const { hash } = await tableland.setController(
      "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
      name
    );

    expect(typeof hash).to.eql("string");
    expect(hash.length).to.eql(66);
  });

  it("set controller with relay", async function () {
    const signer = accounts[1];

    const tableland = connect({
      signer,
      chain: "local-tableland",
      rpcRelay: true /* this is default `true`, just being explicit */,
    });

    const prefix = "test_create_setcontroller_relay";
    // `key` is a reserved word in sqlite
    const { name } = await tableland.create("keyy TEXT, val TEXT", { prefix });

    // Set the controller to Hardhat #7
    const { hash } = await tableland.setController(
      "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
      name
    );

    expect(typeof hash).to.eql("string");
    expect(hash.length).to.eql(66);
  });

  it("get controller returns an address", async function () {
    const signer = accounts[1];

    const tableland = connect({
      signer,
      chain: "local-tableland",
    });

    const prefix = "test_create_getcontroller";
    // `key` is a reserved word in sqlite
    const { name } = await tableland.create("keyy TEXT, val TEXT", { prefix });

    // Hardhat #7
    const controllerAddress = "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955";

    const { hash } = await tableland.setController(controllerAddress, name);

    expect(typeof hash).to.eql("string");
    expect(hash.length).to.eql(66);

    const controller = await tableland.getController(name);

    expect(controller).to.eql(controllerAddress);
  });

  it("lock controller without relay returns a transaction hash", async function () {
    const signer = accounts[1];

    const tableland = connect({
      signer,
      chain: "local-tableland",
      rpcRelay: false,
    });

    const prefix = "test_create_lockcontroller";
    // `key` is a reserved word in sqlite
    const { name } = await tableland.create("keyy TEXT, val TEXT", { prefix });

    // Hardhat #7
    const controllerAddress = "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955";

    const { hash } = await tableland.setController(controllerAddress, name);

    expect(typeof hash).to.eql("string");
    expect(hash.length).to.eql(66);

    const tx = await tableland.lockController(name);

    expect(typeof tx.hash).to.eql("string");
  });

  it("get the schema for a table", async function () {
    const signer = accounts[1];

    const tableland = connect({
      signer,
      chain: "local-tableland",
    });

    const prefix = "test_get_schema";
    const { tableId } = await tableland.create("a INT PRIMARY KEY", { prefix });

    const chainId = 31337;
    const queryableName = `${prefix}_${chainId}_${tableId}`;

    const tableSchema = await tableland.schema(queryableName);

    expect(typeof tableSchema.columns).to.eql("object");
    expect(Array.isArray(tableSchema.table_constraints)).to.eql(true);
    expect(tableSchema.columns.length).to.eql(1);
    expect(tableSchema.columns[0].name).to.eql("a");
    expect(tableSchema.columns[0].type).to.eql("int");
    expect(Array.isArray(tableSchema.columns[0].constraints)).to.eql(true);
    expect(tableSchema.columns[0].constraints[0]).to.eql("PRIMARY KEY");
  });

  it("get the structure for a hash", async function () {
    const signer = accounts[1];

    const tableland = connect({
      signer,
      chain: "local-tableland",
    });

    const prefix = "test_get_structure";
    const { tableId } = await tableland.create("a TEXT, b INT PRIMARY KEY", {
      prefix,
    });

    const chainId = 31337;
    const queryableName = `${prefix}_${chainId}_${tableId}`;

    const { structureHash } = await tableland.hash(
      "a TEXT, b INT PRIMARY KEY",
      { prefix }
    );

    const tableStructure = await tableland.structure(structureHash);

    expect(Array.isArray(tableStructure)).to.eql(true);

    const lastStructure = tableStructure[tableStructure.length - 1];

    expect(lastStructure.name).to.eql(queryableName);
    expect(lastStructure.controller).to.eql(accounts[1].address);
    expect(lastStructure.structure).to.eql(structureHash);
  });

  it("A write that violates table constraints throws error", async function () {
    const signer = accounts[1];

    const tableland = connect({
      signer,
      chain: "local-tableland",
    });

    const prefix = "test_create_tc_violation";
    const { tableId } = await tableland.create(
      "id TEXT, name TEXT, PRIMARY KEY(id)",
      {
        prefix,
      }
    );

    const chainId = 31337;
    const queryableName = `${prefix}_${chainId}_${tableId}`;

    await expect(
      (async function () {
        await tableland.write(
          `INSERT INTO ${queryableName} VALUES (1, '1'), (1, '1')`
        );
      })()
    ).to.be.rejectedWith(
      `db query execution failed (code: SQLITE_UNIQUE constraint failed: ${queryableName}.id, msg: UNIQUE constraint failed: ${queryableName}.id)`
    );
  });
});
