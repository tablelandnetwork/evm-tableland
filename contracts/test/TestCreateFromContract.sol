// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../ITablelandTables.sol";

contract TestCreateFromContract is ERC721, Ownable {
    mapping(string => uint256) public tables;

    ITablelandTables private _tableland;

    constructor(address registry) ERC721("TestCreateFromContract", "MTK") {
        _tableland = ITablelandTables(registry);
    }

    function create(string memory name) public payable {
        require(tables[name] == 0, "name already exists");

        // Make sure we can get table_id back from calling createTable
        uint256 tableId = _tableland.createTable(
            msg.sender,
            string(
                abi.encodePacked(
                    "CREATE TABLE ",
                    name,
                    "_31337 (int id, string name, string description, string external_link);"
                )
            )
        );

        tables[name] = tableId;
    }
}
