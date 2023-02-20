// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../ITablelandControllerV1.sol";
import "../policies/Policies.sol";
import "../policies/ERC721EnumerablePolicies.sol";
import "../policies/ERC721AQueryablePolicies.sol";

contract TestTablelandControllerV1 is ITablelandControllerV1, Ownable {
    error InsufficientValue(uint256 receivedValue, uint256 requiredValue);

    uint256 public constant REQUIRED_VALUE = 1 ether;

    address private _foos;
    address private _bars;

    function getPolicy(
        address
    ) public payable override returns (ITablelandController.Policy memory) {
        // Enforce some ether and revert if insufficient
        if (msg.value != 1 ether) {
            revert InsufficientValue(msg.value, REQUIRED_VALUE);
        }

        // Return policy
        return
            ITablelandController.Policy({
                allowInsert: false,
                allowUpdate: true,
                allowDelete: false,
                whereClause: "",
                withCheck: "",
                updatableColumns: new string[](0)
            });
    }
}
