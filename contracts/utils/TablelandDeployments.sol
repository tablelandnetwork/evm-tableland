// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10 <0.9.0;

import {ITablelandTables} from "../interfaces/ITablelandTables.sol";
import {IERC721AUpgradeable} from "erc721a-upgradeable/contracts/IERC721AUpgradeable.sol";

interface TablelandTablesImpl is ITablelandTables, IERC721AUpgradeable {}

/**
 * @dev Helper library for getting an instance of ITablelandTables for the currently executing EVM chain.
 */
library TablelandDeployments {
    /**
     * Current chain does not have a TablelandTables deployment.
     */
    error ChainNotSupported(uint256 chainid);

    // TablelandTables address on Ethereum.
    address internal constant MAINNET =
        0x012969f7e3439a9B04025b5a049EB9BAD82A8C12;
    // TablelandTables address on Ethereum.
    address internal constant HOMESTEAD = MAINNET;
    // TablelandTables address on Optimism.
    address internal constant OPTIMISM =
        0xfad44BF5B843dE943a09D4f3E84949A11d3aa3e6;
    // TablelandTables address on Arbitrum One.
    address internal constant ARBITRUM =
        0x9aBd75E8640871A5a20d3B4eE6330a04c962aFfd;
    // TablelandTables address on Arbitrum Nova.
    address internal constant ARBITRUM_NOVA =
        0x1A22854c5b1642760a827f20137a67930AE108d2;
    // TablelandTables address on Base.
    address internal constant BASE = 0x8268F7Aba0E152B3A853e8CB4Ab9795Ec66c2b6B;
    // TablelandTables address on Polygon.
    address internal constant POLYGON =
        0x5c4e6A9e5C1e1BF445A062006faF19EA6c49aFeA;
    // TablelandTables address on Filecoin.
    address internal constant FILECOIN =
        0x59EF8Bf2d6c102B4c42AEf9189e1a9F0ABfD652d;

    // TablelandTables address on Ethereum Sepolia.
    address internal constant SEPOLIA =
        0xc50C62498448ACc8dBdE43DA77f8D5D2E2c7597D;
    // TablelandTables address on Optimism Sepolia.
    address internal constant OPTIMISM_SEPOLIA =
        0x68A2f4423ad3bf5139Db563CF3bC80aA09ed7079;
    // TablelandTables address on Arbitrum Sepolia.
    address internal constant ARBITRUM_SEPOLIA =
        0x223A74B8323914afDC3ff1e5005564dC17231d6e;
    // TablelandTables address on Base Sepolia.
    address internal constant BASE_SEPOLIA =
        0xA85aAE9f0Aec5F5638E5F13840797303Ab29c9f9;
    // TablelandTables address on Polygon Amoy.
    address internal constant POLYGON_AMOY =
        0x170fb206132b693e38adFc8727dCfa303546Cec1;
    // TablelandTables address on Filecoin Calibration.
    address internal constant FILECOIN_CALIBRATION =
        0x030BCf3D50cad04c2e57391B12740982A9308621;

    // TablelandTables address on for use with https://github.com/tablelandnetwork/tableland-js/tree/main/packages/local.
    address internal constant LOCAL_TABLELAND =
        0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;

    /**
     * @dev Returns an interface to Tableland for the currently executing EVM chain.
     *
     * The selection order is meant to reduce gas on more expensive chains.
     *
     * Requirements:
     *
     * - block.chainid must refer to a supported chain.
     */
    function get() internal view returns (TablelandTablesImpl) {
        if (block.chainid == 1) {
            return TablelandTablesImpl(MAINNET);
        } else if (block.chainid == 10) {
            return TablelandTablesImpl(OPTIMISM);
        } else if (block.chainid == 42161) {
            return TablelandTablesImpl(ARBITRUM);
        } else if (block.chainid == 42170) {
            return TablelandTablesImpl(ARBITRUM_NOVA);
        } else if (block.chainid == 8453) {
            return TablelandTablesImpl(BASE);
        } else if (block.chainid == 137) {
            return TablelandTablesImpl(POLYGON);
        } else if (block.chainid == 314) {
            return TablelandTablesImpl(FILECOIN);
        } else if (block.chainid == 11155111) {
            return TablelandTablesImpl(SEPOLIA);
        } else if (block.chainid == 11155420) {
            return TablelandTablesImpl(OPTIMISM_SEPOLIA);
        } else if (block.chainid == 421614) {
            return TablelandTablesImpl(ARBITRUM_SEPOLIA);
        } else if (block.chainid == 84532) {
            return TablelandTablesImpl(BASE_SEPOLIA);
        } else if (block.chainid == 80002) {
            return TablelandTablesImpl(POLYGON_AMOY);
        } else if (block.chainid == 314159) {
            return TablelandTablesImpl(FILECOIN_CALIBRATION);
        } else if (block.chainid == 31337) {
            return TablelandTablesImpl(LOCAL_TABLELAND);
        } else {
            revert ChainNotSupported(block.chainid);
        }
    }

    /**
     * @dev Returns the Tableland gateway base URI for the currently executing EVM chain.
     *
     * The selection order is meant to reduce gas on more expensive chains.
     *
     * Requirements:
     *
     * - block.chainid must refer to a supported chain.
     */
    function getBaseURI() internal view returns (string memory) {
        if (block.chainid == 1) {
            return "https://tableland.network/api/v1/";
        } else if (block.chainid == 10) {
            return "https://tableland.network/api/v1/";
        } else if (block.chainid == 42161) {
            return "https://tableland.network/api/v1/";
        } else if (block.chainid == 42170) {
            return "https://tableland.network/api/v1/";
        } else if (block.chainid == 8453) {
            return "https://tableland.network/api/v1/";
        } else if (block.chainid == 137) {
            return "https://tableland.network/api/v1/";
        } else if (block.chainid == 314) {
            return "https://tableland.network/api/v1/";
        } else if (block.chainid == 11155111) {
            return "https://testnets.tableland.network/api/v1/";
        } else if (block.chainid == 11155420) {
            return "https://testnets.tableland.network/api/v1/";
        } else if (block.chainid == 421614) {
            return "https://testnets.tableland.network/api/v1/";
        } else if (block.chainid == 84532) {
            return "https://testnets.tableland.network/api/v1/";
        } else if (block.chainid == 80002) {
            return "https://testnets.tableland.network/api/v1/";
        } else if (block.chainid == 314159) {
            return "https://testnets.tableland.network/api/v1/";
        } else if (block.chainid == 31337) {
            return "http://localhost:8080/api/v1/";
        } else {
            revert ChainNotSupported(block.chainid);
        }
    }
}
