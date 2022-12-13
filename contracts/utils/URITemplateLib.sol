// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./SStrings.sol";

/**
 * @dev Helper library for constructing token URIs where the `tokenId` may not
 * be at the end of the token URI.
 *
 * Use the "single" methods for a single `{id}` substring, e.g., "https://foo.xyz/{id}?bar=baz",
 * and use the "multiple" methods for multiple `{id}`s, e.g., "https://foo.xyz/{id}?bar={id}".
 * The primary difference between the two is gas cost.
 *
 * This is especially useful when driving token metadata from a Tableland query
 * where `tokenId` may be embedded in the middle of the query string.
 */
library URITemplate {
    using SStrings for string;
    using SStrings for SStrings.Slice;

    /**
     * Thrown when the provided template URI does not contain `{id}`.
     */
    error InvalidTemplate();

    // The `tokenId` placeholder in the template.
    string private constant NEEDLE = "{id}";

    /**
     * @dev Sets the URI template for a string containing a single `{id}`.
     *
     * `uriTemplate` - a string containing a single `{id}`
     *
     * Requirements:
     *
     * - the template string must contain exactly one needle substring `{id}`
     */
    function _setURITemplateSingle(
        string memory uriTemplate
    ) internal pure returns (string[] memory) {
        SStrings.Slice[] memory parts = new SStrings.Slice[](2);
        parts[1] = uriTemplate.toSlice();
        parts[1].split(NEEDLE.toSlice(), parts[0]);

        if (parts[0]._len == bytes(uriTemplate).length && parts[1]._len == 0) {
            revert InvalidTemplate();
        }

        string[] memory _uriParts = new string[](2);
        _uriParts[0] = parts[0].toString();
        _uriParts[1] = parts[1].toString();
        return _uriParts;
    }

    /**
     * @dev Sets the URI template for a string containing multiple `{id}` substring.
     *
     * `uriTemplate` - a string containing multiple `{id}`
     *
     * Requirements:
     *
     * - the template string must contain one or more needle substring `{id}`
     */
    function _setURITemplateMultiple(
        string memory uriTemplate
    ) internal pure returns (string[] memory) {
        SStrings.Slice memory uriSlice = uriTemplate.toSlice();
        SStrings.Slice memory delim = NEEDLE.toSlice();
        if (uriSlice.count(delim) == 0) {
            revert InvalidTemplate();
        }

        string[] memory parts = new string[](uriSlice.count(delim) + 1);
        for (uint i = 0; i < parts.length; i++) {
            parts[i] = uriSlice.split(delim).toString();
        }

        return parts;
    }

    /**
     * @dev Returns a token URI based on the set template string, replacing a single `{id}` substring.
     *
     * `tokenIdStr` - the `tokenId` as a string
     */
    function _getTokenURISingle(
        string[] memory uriParts,
        string memory tokenIdStr
    ) internal pure returns (string memory) {
        return
            uriParts.length != 0
                ? string(abi.encodePacked(uriParts[0], tokenIdStr, uriParts[1]))
                : "";
    }

    /**
     * @dev Returns a token URI based on the set template string, replacing one or more `{id}` substrings.
     *
     * `tokenIdStr` - the `tokenId` as a string
     */
    function _getTokenURIMultiple(
        string[] memory uriParts,
        string memory tokenIdStr
    ) internal pure returns (string memory) {
        if (uriParts.length == 0) {
            return "";
        }

        bytes memory uri;
        for (uint256 i = 0; i < uriParts.length; i++) {
            if (i == 0) {
                uri = abi.encodePacked(uriParts[i]);
            } else {
                uri = abi.encodePacked(uri, tokenIdStr, uriParts[i]);
            }
        }

        return string(uri);
    }
}
