// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10 <0.9.0;

import {ERC721AUpgradeable} from "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";
import {ERC721AQueryableUpgradeable} from "erc721a-upgradeable/contracts/extensions/ERC721AQueryableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {AddressUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import {ITablelandTables} from "../ITablelandTables.sol";
import {ITablelandController} from "../ITablelandController.sol";

contract TestTablelandTablesNoConstructor is
    ITablelandTables,
    ERC721AUpgradeable,
    ERC721AQueryableUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    string internal _baseURIString;
    mapping(uint256 => address) internal _controllers;
    mapping(uint256 => bool) internal _locks;
    uint256 internal constant QUERY_MAX_SIZE = 35000;

    function initialize(
        string memory baseURI
    ) public initializerERC721A initializer {
        __ERC721A_init("Tableland Tables", "TABLE");
        __ERC721AQueryable_init();
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _baseURIString = baseURI;
    }

    function createTable(
        address owner,
        string memory statement
    ) external payable override whenNotPaused returns (uint256 tableId) {
        tableId = _nextTokenId();
        _safeMint(owner, 1);

        emit CreateTable(owner, tableId, statement);

        return tableId;
    }

    function runSQL(
        address caller,
        uint256 tableId,
        string memory statement
    ) external payable override whenNotPaused nonReentrant {
        if (!_exists(tableId) || caller != _msgSenderERC721A()) {
            revert Unauthorized();
        }

        uint256 querySize = bytes(statement).length;
        if (querySize > QUERY_MAX_SIZE) {
            revert MaxQuerySizeExceeded(querySize, QUERY_MAX_SIZE);
        }

        emit RunSQL(
            caller,
            ownerOf(tableId) == caller,
            tableId,
            statement,
            _getPolicy(caller, tableId)
        );
    }

    function _getPolicy(
        address caller,
        uint256 tableId
    ) private returns (ITablelandController.Policy memory) {
        address controller = _controllers[tableId];
        if (_isContract(controller)) {
            return
                ITablelandController(controller).getPolicy{value: msg.value}(
                    caller
                );
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
        return account.code.length > 0;
    }

    function setController(
        address caller,
        uint256 tableId,
        address controller
    ) external override whenNotPaused {
        if (
            caller != ownerOf(tableId) ||
            caller != _msgSenderERC721A() ||
            _locks[tableId]
        ) {
            revert Unauthorized();
        }

        _controllers[tableId] = controller;

        emit SetController(tableId, controller);
    }

    function getController(
        uint256 tableId
    ) external view override returns (address) {
        return _controllers[tableId];
    }

    function lockController(
        address caller,
        uint256 tableId
    ) external override whenNotPaused {
        if (
            caller != ownerOf(tableId) ||
            caller != _msgSenderERC721A() ||
            _locks[tableId]
        ) {
            revert Unauthorized();
        }

        _locks[tableId] = true;
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
            emit TransferTable(from, to, startTokenId);
        }
    }

    function _authorizeUpgrade(address) internal view override onlyOwner {} // solhint-disable no-empty-blocks
}
