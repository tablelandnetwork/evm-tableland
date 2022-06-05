// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";
import "erc721a-upgradeable/contracts/extensions/ERC721AQueryableUpgradeable.sol";
import "erc721a-upgradeable/contracts/extensions/ERC721ABurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./ITablelandTables.sol";
import "./ITablelandController.sol";

contract TablelandTables is
    ITablelandTables,
    ERC721AUpgradeable,
    ERC721ABurnableUpgradeable,
    ERC721AQueryableUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    string private _baseURIString;
    mapping(uint256 => address) private _controllers;

    function initialize(string memory baseURI)
        public
        initializerERC721A
        initializer
    {
        __ERC721A_init("Tableland Tables", "TABLE");
        __ERC721ABurnable_init();
        __ERC721AQueryable_init();
        __Ownable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _baseURIString = baseURI;
    }

    function createTable(address owner, string memory statement)
        external
        payable
        override
        whenNotPaused
    {
        uint256 tableId = _nextTokenId();
        _safeMint(owner, 1);

        emit CreateTable(owner, tableId, statement);
    }

    function runSQL(
        address caller,
        uint256 tableId,
        string memory statement
    ) external override whenNotPaused {
        if (
            !(caller == _msgSenderERC721A() || owner() == _msgSenderERC721A())
        ) {
            revert Unauthorized();
        }

        ITablelandController.Policy memory policy = _checkController(
            caller,
            tableId
        );

        bool isOwner = false;
        if (_exists(tableId)) {
            isOwner = ownerOf(tableId) == caller;
        }

        emit RunSQL(caller, isOwner, tableId, statement, policy);
    }

    function _checkController(address caller, uint256 tableId)
        private
        view
        returns (ITablelandController.Policy memory)
    {
        address controller = _controllers[tableId];
        if (_isContract(controller)) {
            ITablelandController c = ITablelandController(controller);
            return c.getPolicy(caller);
        }
        if (!(controller == address(0) || controller == caller)) {
            revert Unauthorized();
        }

        return
            ITablelandController.Policy({
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
        // solhint-disable-next-line no-inline-assembly
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    function setController(
        address caller,
        uint256 tableId,
        address controller
    ) external override whenNotPaused {
        if (!(caller == _msgSenderERC721A() && caller == ownerOf(tableId))) {
            revert Unauthorized();
        }

        _controllers[tableId] = controller;

        emit SetController(tableId, controller);
    }

    function setBaseURI(string memory baseURI) external override onlyOwner {
        _baseURIString = baseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseURIString;
    }

    function pause() external override onlyOwner {
        _pause();
    }

    function unpause() external override onlyOwner {
        _unpause();
    }

    function _startTokenId() internal pure override returns (uint256) {
        return 1;
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

    // solhint-disable-next-line no-empty-blocks
    function _authorizeUpgrade(address) internal view override onlyOwner {}
}
