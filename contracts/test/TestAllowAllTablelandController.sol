// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10 <0.9.0;

import {ITablelandController} from "../ITablelandController.sol";
import {Policies} from "../policies/Policies.sol";
import {ERC721EnumerablePolicies} from "../policies/ERC721EnumerablePolicies.sol";
import {ERC721AQueryablePolicies} from "../policies/ERC721AQueryablePolicies.sol";

contract TestAllowAllTablelandController is ITablelandController {
    function getPolicy(
        address
    ) public payable override returns (ITablelandController.Policy memory) {
        // Return allow-all policy
        return
            ITablelandController.Policy({
                allowInsert: true,
                allowUpdate: true,
                allowDelete: true,
                whereClause: Policies.joinClauses(new string[](0)),
                withCheck: Policies.joinClauses(new string[](0)),
                updatableColumns: new string[](0)
            });
    }
}
