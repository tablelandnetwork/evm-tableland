// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "hardhat/console.sol";

library TablelandControllerLibrary {
    struct Policy {
        bool allowInsert;
        bool allowUpdate;
        bool allowDelete;
        
        string updateWhere;
        string[] updateColumns;
    }
}

abstract contract TablelandController {
    function getPolicy(address caller) public virtual view returns(TablelandControllerLibrary.Policy memory);
}
