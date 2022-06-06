// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../ITablelandController.sol";
import "../utils/Policies.sol";
import "../utils/ERC721EnumerablePolicies.sol";
import "../utils/ERC721AQueryablePolicies.sol";

contract TestTablelandController is ITablelandController, Ownable {
    address private _foos;
    address private _bars;

    function getPolicy(address caller)
        public
        view
        override
        returns (ITablelandController.Policy memory)
    {
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
            ITablelandController.Policy({
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
