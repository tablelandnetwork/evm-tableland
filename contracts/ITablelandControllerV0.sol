// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./TablelandPolicy.sol";

/**
 * @dev Interface of a v0 TablelandController compliant contract.
 */
interface ITablelandControllerV0 {
    /**
     * @dev Returns a {TablelandPolicy} struct defining how a table can be accessed by `caller`.
     */
    function getPolicy(
        address caller
    ) external payable returns (TablelandPolicy memory);
}
