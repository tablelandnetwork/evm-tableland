// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10 <0.9.0;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TestERC721Enumerable is ERC721, ERC721Enumerable, Ownable {

    uint256 private _tokenIdCounter = 1;

    // solhint-disable-next-line no-empty-blocks
    constructor() ERC721("TestERC721Enumerable", "FOO") {}

    function mint() external payable {
        uint256 tokenId = _tokenIdCounter;
        _safeMint(_msgSender(), tokenId);
        _tokenIdCounter += 1;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://foo.xyz/";
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
