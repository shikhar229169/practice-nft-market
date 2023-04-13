// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

error randomNFT__lessETH();
error randomNFT__breedNotFound();
error randomNFT__notOwner();
error randomNFT__zeroBalance();
error randomNFT__ethTransferFailed();

contract randomNFT is ERC721URIStorage, VRFConsumerBaseV2 {
    enum cat {
        angora,
        munchkin,
        persian,
        turkishVan
    }

    string[4] private catURIs;
    uint256 private tokenCounter;
    mapping(uint256 => address) private reqIdToOwner;
    uint256 private immutable i_mintFees;
    uint256[4] private chances;
    address private immutable i_owner;

    // coordinator variables
    VRFCoordinatorV2Interface private immutable vrfCoordinator;
    bytes32 private immutable i_keyHash;
    uint64 private immutable i_subId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private callbackGasLimit;
    uint32 private constant NUM_WORDS = 1;


    // Events
    event NFTRequested(address indexed requester, uint256 indexed requestId);
    event NFTMinted(address indexed owner, uint256 indexed tokenId, cat indexed catBreed);

    constructor(address vrfCoordinatorAddress, string[4] memory URI, uint256[4] memory _chances, bytes32 keyHash, uint64 subId, uint32 _callbackGasLimit, uint256 mintFees) ERC721("Kitty", "KAT") VRFConsumerBaseV2(vrfCoordinatorAddress) {
        catURIs = URI;
        chances = _chances;
        tokenCounter = 0;
        vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorAddress);
        i_keyHash = keyHash;
        i_subId = subId;
        callbackGasLimit = _callbackGasLimit;
        i_mintFees = mintFees;
        i_owner = msg.sender;
    }

    function mintNFT() public payable {
        if (msg.value < i_mintFees) {
            revert randomNFT__lessETH();
        }

        // get the random words, select the uri, safemint, then set uri
        uint256 reqId = vrfCoordinator.requestRandomWords(
            i_keyHash,
            i_subId,
            REQUEST_CONFIRMATIONS,
            callbackGasLimit,
            NUM_WORDS
        );

        reqIdToOwner[reqId] = msg.sender;
        
        emit NFTRequested(msg.sender, reqId);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 tokenId = tokenCounter;
        tokenCounter++;
        address requester = reqIdToOwner[requestId];
        uint256 randomNumber = randomWords[0] % 100;
        
        cat luckyCat = getCatBreed(randomNumber);
        
        _safeMint(requester, tokenId);
        _setTokenURI(tokenId, catURIs[uint256(luckyCat)]);

        emit NFTMinted(requester, tokenId, luckyCat);
    }

    function getCatBreed(uint256 random) public view returns (cat) {
        uint256 prev = 0;
        for (uint256 i=0; i<chances.length; i++) {
            if (random>=prev && random<chances[i]) {
                return cat(i);
            }
            prev = chances[i];
        }

        revert randomNFT__breedNotFound();
    }

    function withdraw() public onlyOwner {
        if (address(this).balance == 0) {
            revert randomNFT__zeroBalance();
        }

        (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
        
        if (!success) {
            revert randomNFT__ethTransferFailed();
        }
    }

    function changeCallbackGasLimit(uint32 newLimit) public onlyOwner {
        callbackGasLimit = newLimit;
    }

    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert randomNFT__notOwner();
        }
        _;
    }

    function getTokenCounter() public view returns (uint256) {
        return tokenCounter;
    }

    function getCatURI(uint256 idx) public view returns (string memory) {
        return catURIs[idx];
    }

    function getReqIdToOwner(uint256 reqId) public view returns (address) {
        return reqIdToOwner[reqId];
    }

    function getChances(uint256 idx) public view returns (uint256) {
        return chances[idx];
    }

    function getMintFees() public view returns (uint256) {
        return i_mintFees;
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getCallbackGasLimit() public view returns (uint32) {
        return callbackGasLimit;
    }

    function getVRFCoordinator() public view returns (address) {
        return address(vrfCoordinator);
    }

    function getKeyHash() public view returns (bytes32) {
        return i_keyHash;
    }

    function getSubId() public view returns (uint64) {
        return i_subId;
    }

    function getNumWords() public pure returns (uint32) {
        return NUM_WORDS;
    }

    function getRequestConfirmations() public pure returns (uint16) {
        return REQUEST_CONFIRMATIONS;
    }
}