// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10 <0.9.0;

import {TablelandController} from "../TablelandController.sol";
import {TablelandPolicy} from "../TablelandPolicy.sol";

// solhint-disable-next-line no-empty-blocks
contract TestRawTablelandController1 is TablelandController {

}

contract TestRawTablelandController2 is TablelandController {
    function getPolicy(
        address,
        uint256
    ) external payable virtual override returns (TablelandPolicy memory) {
        // Revert w/o reason string to trigger call to getPolicy(address)
        // solhint-disable-next-line reason-string
        revert();
    }
}
