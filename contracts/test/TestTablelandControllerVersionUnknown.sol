// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../ITablelandController.sol";
import "../policies/Policies.sol";
import "../policies/ERC721EnumerablePolicies.sol";
import "../policies/ERC721AQueryablePolicies.sol";

contract TestTablelandControllerVersionUnknown is
    ITablelandController,
    Ownable
{
    function version() external pure override returns (uint256) {
        return 55;
    }

    function getPolicy(
        address,
        uint256
    ) public payable override returns (Policy memory) {
        // Return policy
        return
            Policy({
                allowInsert: false,
                allowUpdate: true,
                allowDelete: false,
                whereClause: "",
                withCheck: "",
                updatableColumns: new string[](0)
            });
    }
}
