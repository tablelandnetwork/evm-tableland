// @ts-check
import { join } from "node:path";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { describe, it } from "mocha";
import {
  LocalTableland,
  getAccounts,
  getDatabase,
  getRegistry,
  getValidator,
} from "@tableland/local";

chai.use(chaiAsPromised);
const expect = chai.expect;

const lt = new LocalTableland({
  silent: true,
  registryDir: join("..", "evm-tableland"),
});
const accounts = getAccounts();

describe("Validator, Chain, and SDK work end to end", function () {
  // These tests take a bit longer than normal since we are running them against an actual network
  this.timeout(30000);

  this.beforeAll(async function () {
    await lt.start();
  });

  this.afterAll(async function () {
    await lt.shutdown();
  });

  it("Creates a table that can be read from", async function () {
    const signer = accounts[1];

    const db = getDatabase(signer);

    const prefix = "test_create_read";
    // `key` is a reserved word in sqlite
    const {
      meta: { txn },
    } = await db.prepare(`create table ${prefix} (keyy TEXT, val TEXT)`).run();

    const data = await db.prepare(`SELECT * FROM ${txn?.name};`).raw();
    expect(data).to.eql([]);
  });

  it("Create a table that can be written to", async function () {
    const signer = accounts[1];

    const db = getDatabase(signer);

    const prefix = "test_create_write";

    const {
      meta: { txn },
    } = await db.prepare(`create table ${prefix} (keyy TEXT, val TEXT)`).run();

    const queryableName = txn?.name;

    const writeRes = await db
      .prepare(
        `INSERT INTO ${queryableName} (keyy, val) VALUES ('tree', 'aspen')`
      )
      .run();

    const data = await db.prepare(`SELECT * FROM ${queryableName};`).raw();

    expect(typeof writeRes.meta.txn?.transactionHash).to.eql("string");
    expect(data).to.eql([["tree", "aspen"]]);
  });

  it("Table cannot be written to unless caller is allowed", async function () {
    const signer = accounts[1];

    const db = getDatabase(signer);

    const prefix = "test_not_allowed";
    const {
      meta: { txn },
    } = await db.prepare(`create table ${prefix} (keyy TEXT, val TEXT)`).run();

    const queryableName = txn?.name;

    const data = await db.prepare(`SELECT * FROM ${queryableName};`).raw();
    expect(data).to.eql([]);

    const signer2 = accounts[2];
    const db2 = getDatabase(signer2);

    await expect(
      (async function () {
        await db2
          .prepare(
            `INSERT INTO ${queryableName} (keyy, val) VALUES ('tree', 'aspen')`
          )
          .run();
      })()
    ).to.be.rejectedWith(
      "db query execution failed (code: ACL, msg: not enough privileges)"
    );

    const data2 = await db2
      .prepare(`SELECT * FROM ${queryableName};`)
      .raw();
    expect(data2).to.eql([]);
  });

  it("Create a table can have a row deleted", async function () {
    const signer = accounts[1];

    const db = getDatabase(signer);

    const prefix = "test_create_delete";
    const {
      meta: { txn },
    } = await db.prepare(`create table ${prefix} (keyy TEXT, val TEXT)`).run();

    const queryableName = txn?.name;

    const write1 = await db
      .prepare(
        `INSERT INTO ${queryableName} (keyy, val) VALUES ('tree', 'aspen')`
      )
      .run();

    expect(typeof write1.meta.txn?.transactionHash).to.eql("string");

    const write2 = await db
      .prepare(
        `INSERT INTO ${queryableName} (keyy, val) VALUES ('tree', 'pine')`
      )
      .run();

    expect(typeof write2.meta.txn?.transactionHash).to.eql("string");

    const data = await db.prepare(`SELECT * FROM ${queryableName};`).raw();
    expect(data.length).to.eql(2);

    const delete1 = await db
      .prepare(`DELETE FROM ${queryableName} WHERE val = 'pine';`)
      .run();

    expect(typeof delete1.meta.txn?.transactionHash).to.eql("string");

    const data2 = await db.prepare(`SELECT * FROM ${queryableName};`).raw();
    expect(data2.length).to.eql(1);
  });

  it("Read a table with `table` output", async function () {
    const signer = accounts[1];

    const db = getDatabase(signer);

    const prefix = "test_read";
    const {
      meta: { txn },
    } = await db.prepare(`create table ${prefix} (keyy TEXT, val TEXT)`).run();

    const queryableName = txn?.name;

    await db
      .prepare(
        `INSERT INTO ${queryableName} (keyy, val) VALUES ('tree', 'aspen')`
      )
      .run();

    const data = await db.prepare(`SELECT * FROM ${queryableName};`).raw();

    expect(data).to.eql([["tree", "aspen"]]);
  });

  it("Read a table with `objects` output", async function () {
    const signer = accounts[1];

    const db = getDatabase(signer);

    const prefix = "test_read";
    const {
      meta: { txn },
    } = await db.prepare(`create table ${prefix} (keyy TEXT, val TEXT)`).run();

    const queryableName = txn?.name;

    await db
      .prepare(
        `INSERT INTO ${queryableName} (keyy, val) VALUES ('tree', 'aspen')`
      )
      .run();

    const { results } = await db
      .prepare(`SELECT * FROM ${queryableName};`)
      .all();

    expect(results).to.eql([{ keyy: "tree", val: "aspen" }]);
  });

  it("Read a single row with `first` option", async function () {
    const signer = accounts[1];

    const db = getDatabase(signer);

    const prefix = "test_read";
    const {
      meta: { txn },
    } = await db.prepare(`create table ${prefix} (keyy TEXT, val TEXT)`).run();

    const queryableName = txn?.name;

    await db
      .prepare(
        `INSERT INTO ${queryableName} (keyy, val) VALUES ('tree', 'aspen')`
      )
      .run();

    const data = await db.prepare(`SELECT * FROM ${queryableName};`).first();

    expect(data).to.eql({ keyy: "tree", val: "aspen" });
  });

  it("List an account's tables", async function () {
    const signer = accounts[1];

    const db = getDatabase(signer);
    const reg = getRegistry(signer);

    const prefix = "test_create_list";
    await db.prepare(`create table ${prefix} (keyy TEXT, val TEXT)`).run();

    const tableIds = await reg.listTables();

    expect(Array.isArray(tableIds)).to.eql(true);
  });

  it("write validates table name prefix", async function () {
    const signer = accounts[1];

    const db = getDatabase(signer);

    const prefix = "test_direct_invalid_write";
    await db.prepare(`create table ${prefix} (keyy TEXT, val TEXT);`).run();

    const prefix2 = "test_direct_invalid_write2";
    const {
      meta: { txn },
    } = await db
      .prepare(`create table ${prefix2} (keyy TEXT, val TEXT);`)
      .run();

    // both tables owned by the same account
    // the prefix is for the first table, but id is for second table
    const queryableName = `${prefix}_31337_${txn?.tableId}`;

    await expect(
      (async function () {
        await db
          .prepare(
            `INSERT INTO ${queryableName} (keyy, val) VALUES ('tree', 'aspen')`
          )
          .run();
      })()
    ).to.be.rejectedWith(
      `table prefix lookup for table id: table prefix lookup: no such table: ${prefix}_31337_11`
    );
  });

  it("write statement validates table ID", async function () {
    const signer = accounts[1];

    const db = getDatabase(signer);

    const prefix = "test_direct_invalid_id_write";
    await db.prepare(`create table ${prefix} (keyy TEXT, val TEXT);`).run();

    // the tableId 0 does not exist since we start with tableId == 1
    const queryableName = `${prefix}_31337_0`;

    await expect(
      (async function () {
        await db
          .prepare(
            `INSERT INTO ${queryableName} (keyy, val) VALUES ('tree', 'aspen')`
          )
          .run();
      })()
    ).to.be.rejectedWith(`reverted with custom error 'Unauthorized()'`);
  });

  it("set controller", async function () {
    const signer = accounts[1];

    const db = getDatabase(signer);
    const reg = getRegistry(signer);

    const prefix = "test_create_setcontroller_norelay";
    const {
      meta: { txn },
    } = await db.prepare(`create table ${prefix} (keyy TEXT, val TEXT);`).run();

    // Set the controller to Hardhat #7
    const { hash } = await reg.setController({
      controller: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
      tableName: txn?.name ?? "",
    });

    expect(typeof hash).to.eql("string");
    expect(hash.length).to.eql(66);
  });

  it("get controller returns an address", async function () {
    const signer = accounts[1];

    const db = getDatabase(signer);
    const reg = getRegistry(signer);

    const prefix = "test_create_getcontroller";
    const {
      meta: { txn },
    } = await db.prepare(`create table ${prefix} (keyy TEXT, val TEXT);`).run();

    // Hardhat #7
    const controllerAddress = "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955";

    const { hash } = await reg.setController({
      controller: controllerAddress,
      tableName: txn?.name ?? "",
    });

    expect(typeof hash).to.eql("string");
    expect(hash.length).to.eql(66);

    const controller = await reg.getController(txn?.name ?? "");

    expect(controller).to.eql(controllerAddress);
  });

  it("lock controller returns a transaction hash", async function () {
    const signer = accounts[1];

    const db = getDatabase(signer);
    const reg = getRegistry(signer);

    const prefix = "test_create_lockcontroller";
    const {
      meta: { txn },
    } = await db.prepare(`create table ${prefix} (keyy TEXT, val TEXT);`).run();

    // Hardhat #7
    const controllerAddress = "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955";

    const { hash } = await reg.setController({
      controller: controllerAddress,
      tableName: txn?.name ?? "",
    });

    expect(typeof hash).to.eql("string");
    expect(hash.length).to.eql(66);

    const tx = await reg.lockController(txn?.name ?? "");

    expect(typeof tx.hash).to.eql("string");
  });

  it("get the schema for a table", async function () {
    const signer = accounts[1];

    const db = getDatabase(signer);
    const val = getValidator();

    const prefix = "test_get_schema";
    const {
      meta: { txn },
    } = await db.prepare(`create table ${prefix} (a INT PRIMARY KEY);`).run();

    const { schema: tableSchema } = await val.getTableById(
      /** @type {import("@tableland/sdk").WaitableTransactionReceipt} */ (txn)
    );

    expect(typeof tableSchema.columns).to.eql("object");
    expect(tableSchema.tableConstraints).to.eql(undefined);
    expect(tableSchema.columns.length).to.eql(1);
    expect(tableSchema.columns[0].name).to.eql("a");
    expect(tableSchema.columns[0].type).to.eql("int");
    expect(Array.isArray(tableSchema.columns[0].constraints)).to.eql(true);
    expect((tableSchema.columns[0].constraints ?? [])[0].toLowerCase()).to.eql(
      "primary key"
    );
  });

  it("write that violates table constraints throws error", async function () {
    const signer = accounts[1];

    const db = getDatabase(signer);

    const prefix = "test_create_tc_violation";
    const {
      meta: { txn },
    } = await db
      .prepare(`create table ${prefix} (id TEXT, name TEXT, PRIMARY KEY(id));`)
      .run();

    await expect(
      (async function () {
        await db
          .prepare(`INSERT INTO ${txn?.name} VALUES (1, '1'), (1, '1')`)
          .run();
      })()
    ).to.be.rejectedWith(
      `db query execution failed (code: SQLITE_UNIQUE constraint failed: ${txn?.name}.id, msg: UNIQUE constraint failed: ${txn?.name}.id)`
    );
  });
});
