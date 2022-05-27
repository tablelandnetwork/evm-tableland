// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

library ERC721AQueryablePolicies {

    function getClauseForRequireOneOf(address caller, address target, string memory column) internal view returns(string memory) {
        // Get target contract
        ERC721AQueryable token = ERC721AQueryable(target);

        // Caller must own at least one token
        uint256 balance = token.balanceOf(caller);
        require(balance > 0, "ERC721AQueryablePolicies: unauthorized");

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
