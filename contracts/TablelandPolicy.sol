// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10 <0.9.0;

/**
 * @dev Object defining how a table can be accessed.
 */
struct TablelandPolicy {
    // Whether or not the table should allow SQL INSERT statements.
    bool allowInsert;
    // Whether or not the table should allow SQL UPDATE statements.
    bool allowUpdate;
    // Whether or not the table should allow SQL DELETE statements.
    bool allowDelete;
    // Whether or not the table should allow SQL ALTER TABLE statements.
    bool allowAlter;
    // A conditional clause used with SQL UPDATE and DELETE statements.
    // For example, a value of "foo > 0" will concatenate all SQL UPDATE
    // and/or DELETE statements with "WHERE foo > 0".
    // This can be useful for limiting how a table can be modified.
    // Use {Policies-joinClauses} to include more than one condition.
    string whereClause;
    // A conditional clause used with SQL INSERT statements.
    // For example, a value of "foo > 0" will concatenate all SQL INSERT
    // statements with a check on the incoming data, i.e., "CHECK (foo > 0)".
    // This can be useful for limiting how table data ban be added.
    // Use {Policies-joinClauses} to include more than one condition.
    string withCheck;
    // A list of SQL column names that can be updated.
    string[] updatableColumns;
}
