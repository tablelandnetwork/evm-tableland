// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10 <0.9.0;

import {SQLHelpers} from "../utils/SQLHelpers.sol";

/**
 * @dev SQLHelpers with public methods for testing.
 */
library TestSQLHelpers {
    function toNameFromId(
        string memory prefix,
        uint256 tableId
    ) public view returns (string memory) {
        return SQLHelpers.toNameFromId(prefix, tableId);
    }

    function toCreateFromSchema(
        string memory schema,
        string memory prefix
    ) public view returns (string memory) {
        return SQLHelpers.toCreateFromSchema(schema, prefix);
    }

    function toInsert(
        string memory prefix,
        uint256 tableId,
        string memory columns,
        string memory values
    ) public view returns (string memory) {
        return SQLHelpers.toInsert(prefix, tableId, columns, values);
    }

    function toBatchInsert(
        string memory prefix,
        uint256 tableId,
        string memory columns,
        string[] memory values
    ) public view returns (string memory) {
        return SQLHelpers.toBatchInsert(prefix, tableId, columns, values);
    }

    function toUpdate(
        string memory prefix,
        uint256 tableId,
        string memory setters,
        string memory filters
    ) public view returns (string memory) {
        return SQLHelpers.toUpdate(prefix, tableId, setters, filters);
    }

    function toDelete(
        string memory prefix,
        uint256 tableId,
        string memory filters
    ) public view returns (string memory) {
        return SQLHelpers.toDelete(prefix, tableId, filters);
    }

    function quote(string memory input) public pure returns (string memory) {
        return SQLHelpers.quote(input);
    }
}
