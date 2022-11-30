// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../ITablelandTables.sol";
import "../ITablelandController.sol";
import "../policies/Policies.sol";
import "../policies/ERC721EnumerablePolicies.sol";
import "../policies/ERC721AQueryablePolicies.sol";

contract TestReentrancyRunSQL is ITablelandController, ERC721, Ownable {
    ITablelandTables private _tableland;

    constructor(address registry) ERC721("TestCreateFromContract", "MTK") {
        _tableland = ITablelandTables(registry);
    }

    function getPolicy(
        address
    ) public payable override returns (ITablelandController.Policy memory) {
        uint256 tableId = 1;
        _tableland.runSQL(
            msg.sender,
            tableId,
            "delete * from msgsendertableidontown"
        );
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
