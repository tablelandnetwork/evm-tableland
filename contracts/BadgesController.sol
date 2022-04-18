// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./Controller.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "hardhat/console.sol";

contract BadgesController is TablelandController {

    address private _rigs;

    function getPolicy(address caller) public override view returns(TablelandControllerLibrary.Policy memory) {
        // Get target contract
        ERC721Enumerable token = ERC721Enumerable(_rigs);

        // Caller must own at least one token
        uint256 balance = token.balanceOf(caller);
        require(balance > 0, "BadgesController: unauthorized");

        // Build updateWhere clause with list of the tokens owned by caller
        bytes memory updateWhere = "rig_id in (";
        for (uint256 i = 0; i < balance; i++) {
            bytes memory id = bytes(Strings.toString(token.tokenOfOwnerByIndex(caller, i)));
            if (i == 0) {
                updateWhere = bytes.concat(updateWhere, id);
            } else {
                updateWhere = bytes.concat(updateWhere, ",", id);
            }
        }
        updateWhere = bytes.concat(updateWhere, ")");

        string[] memory updateColumns = new string[](1);
        updateColumns[0] = "position";

        // Return policy
        return TablelandControllerLibrary.Policy({
            allowInsert: false,
            allowUpdate: true,
            allowDelete: false,
            updateWhere: string(updateWhere),
            updateColumns: updateColumns
        });
    }

    function setRigs(address rigs) public {
        _rigs = rigs;
    }
}
