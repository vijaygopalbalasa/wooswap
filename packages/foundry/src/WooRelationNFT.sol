// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error AffectionOverflow();
error AffectionUnderflow();

contract WooRelationNFT is ERC721, Ownable {
    uint256 private _nextTokenId;
    string private _baseTokenURI;

    mapping(uint256 tokenId => uint16 affection) public affectionOf;

    event AffectionUpdated(uint256 indexed tokenId, uint16 newAffection);

    constructor() ERC721("WooRelation", "WOO") Ownable(msg.sender) {
        _baseTokenURI = "ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/";
    }

    function mint(address to) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        affectionOf[tokenId] = 5000; // Start at neutral affection
        emit AffectionUpdated(tokenId, 5000);
        return tokenId;
    }

    function updateAffection(uint256 tokenId, int16 delta) external onlyOwner {
        uint16 currentAffection = affectionOf[tokenId];

        if (delta > 0) {
            uint16 newAffection = currentAffection + uint16(delta);
            if (newAffection > 10000) {
                newAffection = 10000;
            }
            affectionOf[tokenId] = newAffection;
        } else if (delta < 0) {
            uint16 absDelta = uint16(-delta);
            if (absDelta > currentAffection) {
                affectionOf[tokenId] = 0;
            } else {
                affectionOf[tokenId] = currentAffection - absDelta;
            }
        }

        emit AffectionUpdated(tokenId, affectionOf[tokenId]);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }

    function getUserTokenId(address user) external view returns (uint256) {
        uint256 balance = balanceOf(user);
        if (balance == 0) revert("No NFT owned");
        return tokenOfOwnerByIndex(user, 0);
    }

    function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256) {
        if (index >= balanceOf(owner)) revert("Index out of bounds");

        uint256 count = 0;
        for (uint256 i = 0; i < _nextTokenId; i++) {
            if (_ownerOf(i) == owner) {
                if (count == index) {
                    return i;
                }
                count++;
            }
        }
        revert("Token not found");
    }
}