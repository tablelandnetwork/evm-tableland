// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10 <0.9.0;

import {ITablelandController} from "./ITablelandController.sol";
import {TablelandPolicy} from "./TablelandPolicy.sol";

abstract contract TablelandController is ITablelandController {
    /**
     * @dev See {ITablelandController-getPolicy}.
     */
    function getPolicy(
        address,
        uint256
    ) external payable virtual override returns (TablelandPolicy memory) {
        revert("not implemented");
    }

    /**
     * @dev See {ITablelandController-getPolicy}.
     *
     * Deprecated. Use {ITablelandController.getPolicy(address, uint256)}.
     */
    function getPolicy(
        address
    ) external payable override returns (TablelandPolicy memory) {
        revert();
    }
}
