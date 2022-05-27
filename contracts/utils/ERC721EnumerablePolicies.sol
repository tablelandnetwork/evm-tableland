// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

library ERC721EnumerablePolicies {

    function getClauseForRequireOneOf(address caller, address target, string memory column) internal view returns(string memory) {
        // Get target contract
        ERC721Enumerable token = ERC721Enumerable(target);

        // Caller must own at least one token
        uint256 balance = token.balanceOf(caller);
        require(balance > 0, "ERC721EnumerablePolicies: unauthorized");

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
}
