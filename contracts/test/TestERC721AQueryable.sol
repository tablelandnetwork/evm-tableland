// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "erc721a/contracts/ERC721A.sol";
import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "erc721a/contracts/extensions/ERC721ABurnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestERC721AQueryable is
    ERC721A,
    ERC721ABurnable,
    ERC721AQueryable,
    Ownable
{
    // solhint-disable-next-line no-empty-blocks
    constructor() ERC721A("TestERC721AQueryable", "BAR") {}

    function mint() external payable {
        _safeMint(_msgSenderERC721A(), 1);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://bar.xyz/";
    }
}
