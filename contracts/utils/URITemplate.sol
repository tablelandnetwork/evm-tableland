// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4 <0.9.0;

import "./SStrings.sol";

/**
 * @dev Helper contract for constructing token URIs where the tokenId may not
 * be at the end of the token URI, e.g., "https://foo.xyz/{id}?bar=baz".
 *
 * This is especially useful when driving token metadata from a Tableland query
 * where tokenId may be embedded in the middle of the query string.
 */
contract URITemplate {
    using SStrings for string;
    using SStrings for SStrings.Slice;

    /**
     * The template does not contain "{id}".
     */
    error InvalidTemplate();

    // The tokenId placeholder in the template.
    string private constant NEEDLE = "{id}";
    // URI components used to build token URIs.
    string[] private _uriParts = new string[](2);

    constructor(string memory uriTemplate) {
        _setURITemplate(uriTemplate);
    }

    /**
     * @dev Sets the URI template.
     *
     * baseURITemplate - a string containing "{id}"
     *
     * Requirements:
     *
     * - the template string must contain the needle substring "{id}"
     */
    function _setURITemplate(string memory baseURITemplate) internal {
        SStrings.Slice[] memory parts = new SStrings.Slice[](2);
        parts[1] = baseURITemplate.toSlice();
        parts[1].split(NEEDLE.toSlice(), parts[0]);

        if (
            parts[0]._len == bytes(baseURITemplate).length && parts[1]._len == 0
        ) {
            revert InvalidTemplate();
        }

        _uriParts[0] = parts[0].toString();
        _uriParts[1] = parts[1].toString();
    }

    /**
     * @dev Returns a token URI based on the set template string.
     *
     * tokenIdStr - the tokenId as a string
     */
    function _getTokenURI(string memory tokenIdStr)
        internal
        view
        returns (string memory)
    {
        return
            _uriParts.length != 0
                ? string(
                    abi.encodePacked(_uriParts[0], tokenIdStr, _uriParts[1])
                )
                : "";
    }
}
