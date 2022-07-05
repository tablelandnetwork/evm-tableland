// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";
import "erc721a-upgradeable/contracts/extensions/ERC721AQueryableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../ITablelandTables.sol";
import "../ITablelandController.sol";

contract TestTablelandTablesUpgrade is
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

    mapping(uint256 => address) private _dummyStorage;

    function initialize(string memory baseURI)
        public
        initializerERC721A
        initializer
    {
        __ERC721A_init("Tableland Tables", "TABLE");
        __ERC721AQueryable_init();
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _baseURIString = baseURI;
    }

    function createTable(address, string memory)
        external
        payable
        override
        whenNotPaused
        returns (uint256)
    {} // solhint-disable no-empty-blocks

    function runSQL(
        address caller,
        uint256 tableId,
        string memory statement
    ) external payable override whenNotPaused nonReentrant {
        if (
            !_exists(tableId) ||
            !(caller == _msgSenderERC721A() || owner() == _msgSenderERC721A())
        ) {
            revert Unauthorized();
        }

        emit RunSQL(
            caller,
            ownerOf(tableId) == caller,
            tableId,
            statement,
            _getPolicy(caller, tableId)
        );
    }

    function _getPolicy(address caller, uint256 tableId)
        private
        returns (ITablelandController.Policy memory)
    {
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
        address,
        uint256,
        address
    ) external override whenNotPaused {} // solhint-disable no-empty-blocks

    function getController(uint256 tableId)
        external
        view
        override
        returns (address)
    {} // solhint-disable no-empty-blocks

    function lockController(address caller, uint256 tableId)
        external
        override
        whenNotPaused
    {} // solhint-disable no-empty-blocks

    // solhint-disable-next-line no-empty-blocks
    function setBaseURI(string memory) external override onlyOwner {}

    // solhint-disable-next-line no-empty-blocks
    function _baseURI() internal view override returns (string memory) {}

    // solhint-disable-next-line no-empty-blocks
    function pause() external override onlyOwner {}

    // solhint-disable-next-line no-empty-blocks
    function unpause() external override onlyOwner {}

    // solhint-disable-next-line no-empty-blocks
    function _authorizeUpgrade(address) internal view override onlyOwner {}
}
