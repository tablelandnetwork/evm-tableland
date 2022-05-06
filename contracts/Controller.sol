// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "erc721a/contracts/extensions/ERC721AQueryable.sol";

library TablelandControllerLibrary {
    struct Policy {
        bool allowInsert;
        bool allowUpdate;
        bool allowDelete;

        string whereClause;
        string withCheck;

        string[] updatableColumns;
    }
}

abstract contract TablelandController {
    function getPolicy(address caller) public virtual view returns(TablelandControllerLibrary.Policy memory);

    function joinClauses(string[] memory clauses) internal pure returns(string memory) {
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

    function getPolicyForOneOfERC721Enumerable(address caller, address target, string memory column) internal view returns(string memory) {
        // Get target contract
        ERC721Enumerable token = ERC721Enumerable(target);

        // Caller must own at least one token
        uint256 balance = token.balanceOf(caller);
        require(balance > 0, "getPolicyForOneOfERC721Enumerable: unauthorized");

        // Build in set clause with list of the tokens owned by caller
        bytes memory inSet = bytes.concat(bytes(column), " in (");
        for (uint256 i = 0; i < balance; i++) {
            bytes memory id = bytes(Strings.toString(token.tokenOfOwnerByIndex(caller, i)));
            if (i == 0) {
                inSet = bytes.concat(inSet, id);
            } else {
                inSet = bytes.concat(inSet, ",", id);
            }
        }
        inSet = bytes.concat(inSet, ")");

        // Return clause
        return string(inSet);
    }

    function getPolicyForOneOfERC721AQueryable(address caller, address target, string memory column) internal view returns(string memory) {
        // Get target contract
        ERC721AQueryable token = ERC721AQueryable(target);

        // Caller must own at least one token
        uint256 balance = token.balanceOf(caller);
        require(balance > 0, "getPolicyForOneOfERC721AQueryable: unauthorized");

        // Get owner tokens
        uint256[] memory tokens = token.tokensOfOwner(caller);

        // Build in set clause with list of the tokens owned by caller
        bytes memory inSet = bytes.concat(bytes(column), " in (");
        for (uint256 i = 0; i < tokens.length - 1; i++) {
            bytes memory id = bytes(Strings.toString(tokens[i]));
            if (i == 0) {
                inSet = bytes.concat(inSet, id);
            } else {
                inSet = bytes.concat(inSet, ",", id);
            }
        }
        inSet = bytes.concat(inSet, ")");

        // Return clause
        return string(inSet);
    }
}
