// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10 <0.9.0;

import {TablelandDeployments, TablelandTablesImpl, ITablelandTables} from "../utils/TablelandDeployments.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/**
 * @dev TablelandDeployments with public methods for testing.
 */
contract TestTablelandDeployments {
    function create(string memory statement) public {
        TablelandDeployments.get().create(address(this), statement);
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

    function createWithInterface(string memory statement) public {
        TablelandDeployments.getInterface().create(address(this), statement);
    }

    function mutateWithInterface(uint256 id, string memory statement) public {
        TablelandDeployments.getInterface().mutate(
            address(this),
            id,
            statement
        );
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
