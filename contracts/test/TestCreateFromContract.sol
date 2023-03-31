// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10 <0.9.0;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ITablelandTables} from "../interfaces/ITablelandTables.sol";

contract TestCreateFromContract is ERC721, Ownable {
    mapping(string => uint256) public tables;

    ITablelandTables private _tableland;

    constructor(address registry) ERC721("TestCreateFromContract", "MTK") {
        _tableland = ITablelandTables(registry);
    }

    function create(string memory name) public payable {
        require(tables[name] == 0, "name already exists");

        // Make sure we can get table_id from the created table
        uint256 tableId = _tableland.create(
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
