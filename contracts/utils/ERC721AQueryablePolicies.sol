// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

library ERC721AQueryablePolicies {
    error ERC721AQueryablePoliciesUnauthorized();

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
        bytes memory inSet = bytes.concat(bytes(column), " in (");
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
