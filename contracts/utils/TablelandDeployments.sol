// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../ITablelandTables.sol";

/**
 * @dev Helper library for getting an instance of ITablelandTables for the currently executing EVM chain.
 */
library TablelandDeployments {
    /**
     * Current chain does not have a TablelandTables deployment.
     */
    error ChainNotSupported(uint256 chainid);

    // TablelandTables address on Ethereum Goerli.
    address internal constant GOERLI =
        0xa4b0729f02C6dB01ADe92d247b7425953d1DbA25;
    // TablelandTables address on Optimism Kovan.
    address internal constant OPTIMISTIC_KOVAN =
        0xf9C3530C03D335a00163382366a72cc1Ebbd39fF;
    // TablelandTables address on Polygon Mumbai.
    address internal constant POLYGON_MUMBAI =
        0x70364D26743851d4FE43eCb065811402D06bf4AD;

    /**
     * @dev Returns an interface to Tableland for the currently executing EVM chain.
     *
     * Requirements:
     *
     * - block.chainid must refer to a supported chain.
     */
    function get() internal view returns (ITablelandTables) {
        if (block.chainid == 5) {
            return ITablelandTables(GOERLI);
        } else if (block.chainid == 69) {
            return ITablelandTables(OPTIMISTIC_KOVAN);
        } else if (block.chainid == 80001) {
            return ITablelandTables(POLYGON_MUMBAI);
        } else {
            revert ChainNotSupported(block.chainid);
        }
    }
}
