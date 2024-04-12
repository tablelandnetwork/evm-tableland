// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10 <0.9.0;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {URITemplate} from "../utils/URITemplate.sol";

contract TestURITemplate is ERC721, Ownable, URITemplate {
    // Track the current value of the ERC-721 token
    uint256 private _tokenIdCounter;

    // solhint-disable-next-line no-empty-blocks
    constructor() ERC721("TestURITemplate", "URI") {}

    // Set the token URI by passing a string with exactly one `{id}` substring
    function setURITemplate(string[] memory uriTemplate) external onlyOwner {
        _setURITemplate(uriTemplate);
    }

    // Mint an ERC-721 token
    function mint() external payable {
        uint256 tokenId = _tokenIdCounter;
        _safeMint(_msgSender(), tokenId);
        _tokenIdCounter += 1;
    }

    // Return the token URI for the `tokenId`, where each substring `{id}` is replaced with `tokenId`
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "token does not exist");
        return _getTokenURI(Strings.toString(tokenId));
    }
}
