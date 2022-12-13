// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../utils/URITemplateLib.sol";

contract TestURITemplateLib is ERC721, Ownable {
    using Counters for Counters.Counter;
    // Track the current value of the ERC-721 token
    Counters.Counter private _tokenIdCounter;
    // Track the token URI's "parts", where each value is delimited by substring `{id}`
    string[] private _uriParts;
    // For testing purposes, a boolean to track whether the "single" or "multiple" methods are used
    bool isMultiple;

    constructor() ERC721("TestURITemplateLib", "URI") {}

    // Set the token URI by passing a string with exactly one `{id}` substring
    function setURITemplateSingle(
        string memory uriTemplate
    ) external onlyOwner {
        _uriParts = URITemplate._setURITemplateMultiple(uriTemplate);
        isMultiple = false;
    }

    // Set the token URI by passing a string with one or multiple `{id}` substrings
    function setURITemplateMultiple(
        string memory uriTemplate
    ) external onlyOwner {
        _uriParts = URITemplate._setURITemplateMultiple(uriTemplate);
        isMultiple = true;
    }

    // Mint an ERC-721 token
    function mint() external payable {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(_msgSender(), tokenId);
    }

    // Return the token URI for the `tokenId`, where each substring `{id}` is replaced with `tokenId`
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(_exists(tokenId), "token does not exist");
        return
            isMultiple
                ? URITemplate._getTokenURIMultiple(
                    _uriParts,
                    Strings.toString(tokenId)
                )
                : URITemplate._getTokenURISingle(
                    _uriParts,
                    Strings.toString(tokenId)
                );
    }
}
