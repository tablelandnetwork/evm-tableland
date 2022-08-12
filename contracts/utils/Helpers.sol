// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4 <0.9.0;

import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @dev Library of helpers for generating SQL statements from common parameters.
 */
library Helpers {
    /**
     * @notice Generates a properly formatted table name from a prefix and table id.
     * @param prefix the user generated table prefix as a string.
     * @param tableId the Tableland generated tableId as a uint256.
     * @return name newly allocated string containing the table name.
     *
     * @dev requirements: block.chainid must refer to a supported chain.
     */
    function getNameFromId(string memory prefix, uint256 tableId)
        public
        view
        returns (string memory)
    {
        return
            string.concat(
                prefix,
                "_",
                Strings.toString(block.chainid),
                "_",
                Strings.toString(tableId)
            );
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
    function getCreateFromSchema(string memory prefix, string memory schema)
        public
        view
        returns (string memory)
    {
        return
            string.concat(
                "CREATE TABLE ",
                prefix,
                "_",
                Strings.toString(block.chainid),
                " (",
                schema,
                ");"
            );
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
    function getInsert(
        string memory prefix,
        uint256 tableId,
        string memory columns,
        string memory values
    ) public view returns (string memory) {
        string memory name = getNameFromId(prefix, tableId);
        return
            string.concat(
                "INSERT INTO ",
                name,
                " (",
                columns,
                ") VALUES ",
                values
            );
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
    function getUpdate(
        string memory prefix,
        uint256 tableId,
        string memory setters,
        string memory filters
    ) public view returns (string memory) {
        string memory name = getNameFromId(prefix, tableId);
        string memory filter = "";
        if (bytes(filters).length > 0) {
            filter = string.concat("WHERE ", filters);
        }
        return string.concat("UPDATE ", name, "SET ", setters, filter);
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
    function getDelete(
        string memory prefix,
        uint256 tableId,
        string memory filters
    ) public view returns (string memory) {
        string memory name = getNameFromId(prefix, tableId);
        return string.concat("DELETE FROM ", name, "WHERE ", filters);
    }
}
