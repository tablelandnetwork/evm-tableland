// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @dev Library of helpers for generating SQL statements from common parameters.
 */
library SQLHelpers {
    /**
     * @notice Generates a properly formatted table name from a prefix and table id.
     * @param prefix the user generated table prefix as a string.
     * @param tableId the Tableland generated tableId as a uint256.
     * @return name newly allocated string containing the table name.
     *
     * @dev requirements: block.chainid must refer to a supported chain.
     */
    function toNameFromId(string memory prefix, uint256 tableId)
        public
        view
        returns (string memory)
    {
        return
            string(abi.encodePacked(
                prefix,
                "_",
                Strings.toString(block.chainid),
                "_",
                Strings.toString(tableId)
            ));
    }

    /**
     * @notice Generates a CREATE statement based on a desired schema and table prefix.
     *
     * @param prefix the user generated table prefix as a string.
     * @param schema a comma seperated string indicating the desired prefix. Example: "int id, text name".
     * @return create newly allocated string containing the create statement.
     *
     * @dev requirements: block.chainid must refer to a supported chain.
     */
    function toCreateFromSchema(string memory prefix, string memory schema)
        public
        view
        returns (string memory)
    {
        return
            string(abi.encodePacked(
                "CREATE TABLE ",
                prefix,
                "_",
                Strings.toString(block.chainid),
                " (",
                schema,
                ")"
            ));
    }

    /**
     * @notice Generates an INSERT statement based on table prefix, tableId, columns, and values.
     *
     * @param prefix the user generated table prefix as a string.
     * @param tableId the Tableland generated tableId as a uint256.
     * @param columns a string encoded ordered list of columns that will be updated. Example: "name, age".
     * @param values a string encoded ordered list of values that will be inserted wrapped in parentheses. Example: "('jerry', 24)".
     * @return insert newly allocated string containing the insert statement.
     *
     * @dev requirements: block.chainid must refer to a supported chain.
     */
    function toInsert(
        string memory prefix,
        uint256 tableId,
        string memory columns,
        string memory values
    ) public view returns (string memory) {
        string memory name = toNameFromId(prefix, tableId);(prefix, tableId);
        return
            string(abi.encodePacked(
                "INSERT INTO ",
                name,
                " (",
                columns,
                ") VALUES (",
                values
                ,
                ")"
            ));
    }

    /**
     * @notice Generates an Update statement based on table prefix, tableId, setters, and filters.
     *
     * @param prefix the user generated table prefix as a string.
     * @param tableId the Tableland generated tableId as a uint256.
     * @param setters a string encoded set of updates. Example: "name='tom', age=26".
     * @param filters a string encoded list of filters or "" for no filters. Example: "id<2 & name!='jerry'".
     * @return update newly allocated string containing the update statement.
     *
     * @dev requirements: block.chainid must refer to a supported chain.
     */
    function toUpdate(
        string memory prefix,
        uint256 tableId,
        string memory setters,
        string memory filters
    ) public view returns (string memory) {
        string memory name = toNameFromId(prefix, tableId);(prefix, tableId);
        string memory filter = "";
        if (bytes(filters).length > 0) {
            filter = string(abi.encodePacked(" WHERE ", filters));
        }
        return
            string(abi.encodePacked(
                "UPDATE ", name, " SET ", setters, filter
            ));
    }

    /**
     * @notice Generates a Delete statement based on table prefix, tableId, and filters.
     *
     * @param prefix the user generated table prefix as a string.
     * @param tableId the Tableland generated tableId as a uint256.
     * @param filters a string encoded list of filters. Example: "id<2 & name!='jerry'".
     * @return delete newly allocated string containing the delete statement.
     *
     * @dev requirements: block.chainid must refer to a supported chain.
     */
    function toDelete(
        string memory prefix,
        uint256 tableId,
        string memory filters
    ) public view returns (string memory) {
        string memory name = toNameFromId(prefix, tableId);(prefix, tableId);
        return
            string(abi.encodePacked(
                "DELETE FROM ", name, " WHERE ", filters
            ));
    }
}
