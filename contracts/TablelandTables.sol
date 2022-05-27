// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";
import "erc721a-upgradeable/contracts/extensions/ERC721AQueryableUpgradeable.sol";
import "erc721a-upgradeable/contracts/extensions/ERC721ABurnableUpgradeable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./ITablelandTables.sol";
import "./ITablelandController.sol";

contract TablelandTables is
    ITablelandTables,
    ERC721AUpgradeable,
    ERC721ABurnableUpgradeable,
    ERC721AQueryableUpgradeable,
    Ownable,
    Pausable {

    string private _baseURIString;
    mapping(uint256 => address) private _controllers;

    function initialize(string memory baseURI) public initializerERC721A {
        __ERC721A_init("Tableland Tables", "TABLE");
        setBaseURI(baseURI);
    }

    function createTable(address owner, string memory statement) public override whenNotPaused {
        uint256 tableId = _nextTokenId();
        _safeMint(owner, 1);

        emit CreateTable(owner, tableId, statement);
    }

    function runSQL(address caller, uint256 tableId, string memory statement) public override whenNotPaused {
        require(caller == _msgSenderERC721A() || caller == owner(), "Tables: caller must be sender or owner");

        ITablelandController.Policy memory policy = _checkController(caller, tableId);

        bool isOwner = false;
        if (_exists(tableId)) {
            isOwner = ownerOf(tableId) == caller;
        }

        emit RunSQL(caller, isOwner, tableId, statement, policy);
    }

    function setController(address caller, uint256 tableId, address controller) public override whenNotPaused {
        require(caller == _msgSenderERC721A(), "Tables: caller must be sender");
        require(ownerOf(tableId) == caller, "Tables: caller is not table owner");

        _controllers[tableId] = controller;

        emit SetController(tableId, controller);
    }

    function _checkController(address caller, uint256 tableId) private view returns (
        ITablelandController.Policy memory
    ) {
        address controller = _controllers[tableId];
        if (_isContract(controller)) {
            ITablelandController c = ITablelandController(controller);
            return c.getPolicy(caller);
        }
        require(controller == address(0) || controller == caller, "Tables: unauthorized");

        return ITablelandController.Policy({
            allowInsert: true,
            allowUpdate: true,
            allowDelete: true,
            whereClause: "",
            withCheck: "",
            updatableColumns: new string[](0)
        });
    }

    function _isContract(address account) private view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }

    function setBaseURI(string memory baseURI) public override onlyOwner {
        _baseURIString = baseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseURIString;
    }

    function pause() public override onlyOwner {
        _pause();
    }

    function unpause() public override onlyOwner {
        _unpause();
    }

    function _afterTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal override {
        super._afterTokenTransfers(from, to, startTokenId, quantity);
        if (from != address(0)) {
            emit TransferTable(from, to, startTokenId, quantity);
        }
    }

    function supportsInterface(bytes4 interfaceId) public view override (ERC721AUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
