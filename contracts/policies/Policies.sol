// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10 <0.9.0;

/**
 * @dev Library containing {TablelandPolicy} helper methods.
 */
library Policies {
    /**
     * @dev Joins multiple conditional clauses for {TablelandPolicy}'s `whereClause` and `withCheck` fields.
     */
    function joinClauses(
        string[] memory clauses
    ) internal pure returns (string memory) {
        bytes memory clause;
        for (uint256 i = 0; i < clauses.length; i++) {
            if (bytes(clauses[i]).length == 0) {
                continue;
            }
            if (bytes(clause).length > 0) {
                clause = bytes.concat(clause, bytes(" and "));
            }
            clause = bytes.concat(clause, bytes(clauses[i]));
        }
        return string(clause);
    }
}
