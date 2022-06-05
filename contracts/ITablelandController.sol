// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface ITablelandController {
    struct Policy {
        bool allowInsert;
        bool allowUpdate;
        bool allowDelete;
        string whereClause;
        string withCheck;
        string[] updatableColumns;
    }

    function getPolicy(address caller) external view returns (Policy memory);
}
