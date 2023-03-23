// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10 <0.9.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Policies} from "../policies/Policies.sol";
import {ERC721EnumerablePolicies} from "../policies/ERC721EnumerablePolicies.sol";
import {ERC721AQueryablePolicies} from "../policies/ERC721AQueryablePolicies.sol";

/**
 * @dev This is an exact copy of the original ITablelandController, maintained here to ensure backwards compatibility.
 */
interface ITablelandControllerV0Test {
    struct Policy {
        bool allowInsert;
        bool allowUpdate;
        bool allowDelete;
        string whereClause;
        string withCheck;
        string[] updatableColumns;
    }

    function getPolicy(address caller) external payable returns (Policy memory);
}

contract TestTablelandControllerV0 is ITablelandControllerV0Test, Ownable {
    error InsufficientValue(uint256 receivedValue, uint256 requiredValue);

    uint256 public constant REQUIRED_VALUE = 1 ether;

    address private _foos;
    address private _bars;

    function getPolicy(
        address caller
    ) public payable override returns (Policy memory) {
        // Enforce some ether and revert if insufficient
        if (msg.value != 1 ether) {
            revert InsufficientValue(msg.value, REQUIRED_VALUE);
        }

        string[] memory whereClauses = new string[](2);
        string[] memory withChecks = new string[](3);

        // Require one of FOO
        whereClauses[0] = ERC721EnumerablePolicies.getClauseForRequireOneOf(
            caller,
            _foos,
            "foo_id"
        );

        // Require one of BAR
        whereClauses[1] = ERC721AQueryablePolicies.getClauseForRequireOneOf(
            caller,
            _bars,
            "bar_id"
        );

        // Restrict updates to a single column
        string[] memory updatableColumns = new string[](1);
        updatableColumns[0] = "baz";

        // Include a check on the incoming data
        withChecks[0] = ""; // included to filter in Policies.joinClauses
        withChecks[1] = "baz > 0";
        withChecks[2] = ""; // included to filter in Policies.joinClauses

        // Return policy
        return
            Policy({
                allowInsert: false,
                allowUpdate: true,
                allowDelete: false,
                whereClause: Policies.joinClauses(whereClauses),
                withCheck: Policies.joinClauses(withChecks),
                updatableColumns: updatableColumns
            });
    }

    function setFoos(address foos) external onlyOwner {
        _foos = foos;
    }

    function setBars(address bars) external onlyOwner {
        _bars = bars;
    }
}
