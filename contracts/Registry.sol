// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// Created with: https://wizard.openzeppelin.com/#erc721

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./Controller.sol";


/// @custom:security-contact security@textile.io
contract TablelandTables is
    Initializable,
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    ERC721BurnableUpgradeable,
    UUPSUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    CountersUpgradeable.Counter private _tokenIdCounter;
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    string private _baseURIString;

    mapping(uint256 => address) private _controllers;

    function initialize(string memory baseURI) public initializer {
        __ERC721_init("Tableland Tables", "TABLE");
        __ERC721Enumerable_init();
        __Pausable_init();
        __AccessControl_init();
        __ERC721Burnable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        setBaseURI(baseURI);
    }

    event CreateTable(address caller, uint256 tableId, string statement);

    function createTable(address caller, string memory statement) public {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(caller, tokenId);

        emit CreateTable(caller, tokenId, statement);
    }

    event RunSQL(
        address caller,
        uint256 tokenId,
        string statement,
        TablelandControllerLibrary.Policy policy
    );

    function runSQL(address caller, uint256 tokenId, string memory statement) public {
        require(caller == _msgSender(), "Tables: caller must be sender"); // temp, caller must be sender (later msg.sender could be a delegate)
        
        TablelandControllerLibrary.Policy memory policy = _checkController(caller, tokenId);

        emit RunSQL(caller, tokenId, statement, policy);
    }

    event SetController(uint256 tokenId, address controller);

    function setController(address caller, uint256 tokenId, address controller) public {
        require(caller == _msgSender(), "Tables: caller must be sender"); // temp, caller must be sender (later msg.sender could be a delegate)
        require(_isApprovedOrOwner(caller, tokenId), "ERC721: caller is not owner nor approved");

        _controllers[tokenId] = controller;

        emit SetController(tokenId, controller);
    }

    function _checkController(address caller, uint256 tokenId) private view returns (TablelandControllerLibrary.Policy memory) {
        address controller = _controllers[tokenId];
        if (_isContract(controller)) {
            TablelandController c = TablelandController(controller);
            return c.getPolicy(caller);
        }
        require(controller == address(0) || controller == caller, "Tables: unauthorized");

        return TablelandControllerLibrary.Policy({
            allowInsert: true,
            allowUpdate: true,
            allowDelete: true,
            whereClause: "",
            withCheck: "",
            updatableColumns: new string[](1)
        });
    }

    function _isContract(address account) private view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    function setBaseURI(string memory baseURI)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _baseURIString = baseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseURIString;
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    )
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        whenNotPaused
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(
            ERC721Upgradeable,
            ERC721EnumerableUpgradeable,
            AccessControlUpgradeable
        )
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
