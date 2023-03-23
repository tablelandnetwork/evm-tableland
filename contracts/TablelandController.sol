// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10 <0.9.0;

import {ITablelandController} from "./interfaces/ITablelandController.sol";
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
     * @notice DEPRECATED. Use {TablelandController.getPolicy(address, uint256)} instead.
     */
    function getPolicy(
        address
    ) external payable override returns (TablelandPolicy memory) {
        // solhint-disable-next-line reason-string
        revert();
    }
}
