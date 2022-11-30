// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../ITablelandTables.sol";
import "../ITablelandController.sol";
import "../policies/Policies.sol";
import "../policies/ERC721EnumerablePolicies.sol";
import "../policies/ERC721AQueryablePolicies.sol";

contract TestReentrancyBulkSQL is ITablelandController, ERC721, Ownable {
    ITablelandTables private _tableland;
    ITablelandTables.Runnable[] private runnables;

    constructor(address registry) ERC721("TestCreateFromContract", "MTK") {
        _tableland = ITablelandTables(registry);
    }

    function getPolicy(
        address
    ) public payable override returns (ITablelandController.Policy memory) {
        // try to reenter `bulkSQL` with some kind of malicious call...
        uint256 tableId = 1;
        ITablelandTables.Runnable memory runnable = ITablelandTables.Runnable({
            tableId: tableId,
            statement: "delete * from msgsendertableidontown"
        });

        runnables.push(runnable);

        _tableland.bulkSQL(msg.sender, runnables);
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
