// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

error dynamicNFT__lessETH();
error dynamicNFT__invalidTokenId();
error dynamicNFT__notOwner();
error dynamicNFT__zeroBalance();
error dynamicNFT__ethTransferFailed();

contract dynamicNFT is ERC721 {
    uint256 private tokenCounter;
    uint256 private immutable i_mintFees;
    string private sadURI;
    string private happyURI;
    AggregatorV3Interface private immutable i_priceFeeds;
    mapping(uint256 => int256) private tokenIdToHighValue;
    address private immutable i_owner;

    //Events
    event NFTMinted(address indexed owner, uint256 indexed tokenId);
    event highValueChanged(uint256 indexed tokenId, int256 indexed oldHighValue, int256 indexed newHighValue);

    constructor(address priceFeedsAddress, uint256 mintFees, string memory sadSVGImage, string memory happySVGImage) ERC721("MemesCat", "Luna") {
        i_priceFeeds = AggregatorV3Interface(priceFeedsAddress);
        i_mintFees = mintFees;
        tokenCounter = 0;

        sadURI = svgImageToURI(sadSVGImage);
        happyURI = svgImageToURI(happySVGImage);
        i_owner = msg.sender;
    }

    function svgImageToURI(string memory image) public pure returns (string memory) {
        string memory base64Hash = Base64.encode(bytes(image));
        return string.concat("data:image/svg+xml;base64,", base64Hash);
    }

    function mintNFT(int256 highValue) public payable {
        if (msg.value < i_mintFees) {
            revert dynamicNFT__lessETH();
        }

        uint256 tokenId = tokenCounter;
        tokenCounter++;

        _safeMint(msg.sender, tokenId);
        tokenIdToHighValue[tokenId] = highValue;
        emit NFTMinted(msg.sender, tokenId);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) {
            revert dynamicNFT__invalidTokenId();
        }

        (, int256 price, , , ) = i_priceFeeds.latestRoundData();

        string memory nftName;
        string memory imageURI;
        string memory description;
        if (price >= tokenIdToHighValue[tokenId]) {
            nftName = "do pal khushi ke";
            imageURI = happyURI;
            description = "Me bolu meow meow mere he char paw";
        }
        else {
            nftName = "ye gam khatam khae nhi hota";
            imageURI = sadURI;
            description = "Zindgi kesi he paheli, kabhi ye hasae kabhi ye rulae";
        }
        
        string memory finalURI = string.concat(_baseURI(), Base64.encode(abi.encodePacked('{"name":"', nftName, '","description":"', description, '","image":"', imageURI, '"}')));
        return finalURI;
    }

    function changeHighValue(uint256 tokenId, int256 newHighValue) public {
        if (!_exists(tokenId)) {
            revert dynamicNFT__invalidTokenId();
        }

        if (msg.sender != ownerOf(tokenId)) {
            revert dynamicNFT__notOwner();
        }

        int256 oldHighValue = tokenIdToHighValue[tokenId];

        tokenIdToHighValue[tokenId] = newHighValue;
        emit highValueChanged(tokenId, oldHighValue, newHighValue);
    }

    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert dynamicNFT__notOwner();
        }
        _;
    }

    function withdraw() public onlyOwner {
        if (address(this).balance == 0) {
            revert dynamicNFT__zeroBalance();
        }

        (bool success, ) = payable(i_owner).call{value: address(this).balance}("");

        if (!success) {
            revert dynamicNFT__ethTransferFailed();
        }
    }


    function getTokenCounter() public view returns (uint256) {
        return tokenCounter;
    }

    function getMintFees() public view returns (uint256) {
        return i_mintFees;
    }

    function getSadImageURI() public view returns (string memory) {
        return sadURI;
    }

    function getHappyImageURI() public view returns (string memory) {
        return happyURI;
    }

    function getPriceFeedsAddress() public view returns (address) {
        return address(i_priceFeeds);
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getTokenIdToHighValue(uint256 tokenId) public view returns (int256) {
        return tokenIdToHighValue[tokenId];
    }
}