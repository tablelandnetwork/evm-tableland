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

/**
 * @dev Implementation of {ITablelandTables}.
 */
contract TablelandTables is
    ITablelandTables,
    ERC721AUpgradeable,
    ERC721ABurnableUpgradeable,
    ERC721AQueryableUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    // A URI used to reference off-chain table metadata.
    string private _baseURIString;
    // A mapping of table ids to table controller addresses.
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

    /**
     * @dev See {ITablelandTables-createTable}.
     */
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

    /**
     * @dev See {ITablelandTables-runSQL}.
     */
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

        ITablelandController.Policy memory policy = _getPolicy(caller, tableId);

        bool isOwner = false;
        if (_exists(tableId)) {
            isOwner = ownerOf(tableId) == caller;
        }

        emit RunSQL(caller, isOwner, tableId, statement, policy);
    }

    /**
     * @dev Returns an {ITablelandController.Policy} for `caller` and `tableId`.
     *
     * An allow-all policy is returned if the table's controller does not exist.
     *
     * Requirements:
     *
     * - if the controller is an EOA, caller must be controller
     * - if the controller is a contract address, it must implement {ITablelandController}
     */
    function _getPolicy(address caller, uint256 tableId)
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

    /**
     * @dev Returns whether or not `account` is a contract address.
     */
    function _isContract(address account) private view returns (bool) {
        uint256 size;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    /**
     * @dev See {ITablelandTables-setController}.
     */
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

    /**
     * @dev See {ITablelandTables-setBaseURI}.
     */
    function setBaseURI(string memory baseURI) external override onlyOwner {
        _baseURIString = baseURI;
    }

    /**
     * @dev See {ERC721AUpgradeable-_baseURI}.
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseURIString;
    }

    /**
     * @dev See {ITablelandTables-pause}.
     */
    function pause() external override onlyOwner {
        _pause();
    }

    /**
     * @dev See {ITablelandTables-unpause}.
     */
    function unpause() external override onlyOwner {
        _unpause();
    }

    /**
     * @dev See {ERC721AUpgradeable-_startTokenId}.
     */
    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }

    /**
     * @dev See {ERC721AUpgradeable-_afterTokenTransfers}.
     */
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

    /**
     * @dev See {UUPSUpgradeable-_authorizeUpgrade}.
     */
    function _authorizeUpgrade(address) internal view override onlyOwner {} // solhint-disable no-empty-blocks
}
