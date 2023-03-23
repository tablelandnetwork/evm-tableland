// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10 <0.9.0;

import {ERC721AQueryable} from "erc721a/contracts/extensions/ERC721AQueryable.sol";
import {StringsUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

/**
 * @dev Library containing {ERC721AQueryable}-related helper methods for writing {TablelandPolicy}s.
 */
library ERC721AQueryablePolicies {
    /**
     * The caller is not authorized.
     */
    error ERC721AQueryablePoliciesUnauthorized();

    /**
     * @dev Returns a conditional clause that restricts SQL operations to `column` where the value must be
     * equal to `target` {ERC721AQueryable} tokens owned by `caller`.
     *
     * Useful when you want to restict table INSERT / UPDATE / DELETE to owners of a given NFT collection.
     * Intented to be used with {TablelandPolicy}'s `whereClause` or `withCheck` fields.
     *
     * caller - the address that the policy if for
     * tableId - the address of the {ERC721AQueryable} token that `caller` must be an owner of
     * column - the SQL column to restrict
     */
    function getClauseForRequireOneOf(
        address caller,
        address target,
        string memory column
    ) internal view returns (string memory) {
        // Get target contract
        ERC721AQueryable token = ERC721AQueryable(target);

        // Caller must own at least one token
        uint256 balance = token.balanceOf(caller);
        if (balance == 0) {
            revert ERC721AQueryablePoliciesUnauthorized();
        }

        // Get owner tokens
        uint256[] memory tokens = token.tokensOfOwner(caller);

        // Build in set clause with list of the tokens owned by caller
        bytes memory inSet = bytes.concat(bytes(column), " in(");
        for (uint256 i = 0; i < tokens.length; i++) {
            bytes memory id = bytes(StringsUpgradeable.toString(tokens[i]));
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
