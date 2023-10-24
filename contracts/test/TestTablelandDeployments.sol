// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10 <0.9.0;

import {TablelandDeployments} from "../utils/TablelandDeployments.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {SQLHelpers} from "../utils/SQLHelpers.sol";

/**
 * @dev TablelandDeployments with public methods for testing.
 */
contract TestTablelandDeployments {
    uint256 private _tableId;
    string private constant _TABLE_PREFIX = "test";

    function create(string memory statement) public {
        _tableId = TablelandDeployments.get().create(address(this), statement);
    }

    function mutate(uint256 id, string memory statement) public {
        TablelandDeployments.get().mutate(address(this), id, statement);
    }

    function setController(uint256 id, address controller) public {
        TablelandDeployments.get().setController(address(this), id, controller);
    }

    function safeTransferFrom(address to, uint256 id) public {
        TablelandDeployments.get().safeTransferFrom(address(this), to, id);
    }

    function getBaseURI() public view returns (string memory) {
        return TablelandDeployments.getBaseURI();
    }

    // Get the table ID for testing purposes
    function getTableId() external view returns (uint256) {
        return _tableId;
    }

    // Get the table name for testing purposes
    function getTableName() external view returns (string memory) {
        return SQLHelpers.toNameFromId(_TABLE_PREFIX, _tableId);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
