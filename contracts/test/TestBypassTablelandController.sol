// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../ITablelandController.sol";
import "../utils/Policies.sol";
import "../utils/ERC721EnumerablePolicies.sol";
import "../utils/ERC721AQueryablePolicies.sol";

import "hardhat/console.sol";

contract TestBypassTablelandController is ITablelandController {

    function getPolicy(address) public pure override returns(ITablelandController.Policy memory) {
        // Return allow-all policy
        return ITablelandController.Policy({
            allowInsert: true,
            allowUpdate: true,
            allowDelete: true,
            whereClause: "",
            withCheck: "",
            updatableColumns: new string[](0)
        });
    }
}
