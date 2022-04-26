// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Rigs is ERC721, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("Rigs", "RIG") {}

    function _baseURI() internal pure override returns (string memory) {
        return "http://localhost:8080/query?s=";
    }

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        string memory baseURI = _baseURI();
        if (bytes(baseURI).length == 0) {
            return "";
        }

        string memory query = "select%20json_build_object('name'%2C%20concat('%23'%2C%20rigs.id)%2C%20'external_url'%2C%20concat('https%3A%2F%2Frigs.tableland.xyz%2F'%2C%20rigs.id)%2C%20'attributes'%2C%20json_build_array(json_build_object('trait_type'%2C%20'Fleet'%2C%20'value'%2C%20rigs.fleet)%2C%20json_build_object('trait_type'%2C%20'Chassis'%2C%20'value'%2C%20rigs.chassis)%2C%20json_build_object('trait_type'%2C%20'Wheels'%2C%20'value'%2C%20rigs.wheels)%2C%20json_build_object('trait_type'%2C%20'Background'%2C%20'value'%2C%20rigs.background)%2C%20json_build_object('trait_type'%2C%20(select%20name%20from%20badges%20where%20badges.rig_id%20%3D%20rigs.id%20and%20position%20%3D%201%20limit%201)%2C%20'value'%2C%20(select%20image%20from%20badges%20where%20badges.rig_id%20%3D%20rigs.id%20and%20position%20%3D%201%20limit%201))%2C%20json_build_object('trait_type'%2C%20(select%20name%20from%20badges%20where%20badges.rig_id%20%3D%20rigs.id%20and%20position%20%3D%202%20limit%201)%2C%20'value'%2C%20(select%20image%20from%20badges%20where%20badges.rig_id%20%3D%20rigs.id%20and%20position%20%3D%202%20limit%201))))%20from%20rigs%20where%20rigs.id%20%3D%20";
        query = string(abi.encodePacked(query, Strings.toString(tokenId)));
        query = string(abi.encodePacked(query, "%3B"));
        return string(abi.encodePacked(baseURI, query));
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}