// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./ITablelandController.sol";

interface ITablelandTables {

    error Unauthorized();

    event CreateTable(address owner, uint256 tableId, string statement);

    event TransferTable(address from, address to, uint256 startTableId, uint256 quantity);

    event RunSQL(
        address caller,
        bool isOwner,
        uint256 tableId,
        string statement,
        ITablelandController.Policy policy
    );

    event SetController(uint256 tableId, address controller);

    function createTable(address owner, string memory statement) external payable;

    function runSQL(address caller, uint256 tableId, string memory statement) external;

    function setController(address caller, uint256 tableId, address controller) external;

    function setBaseURI(string memory baseURI) external;

    function pause() external;

    function unpause() external;
}
