const { ethers } = require("hardhat");

const networkConfig = {
    11155111: {
        name: "sepolia",
        vrfCoordinatorAddress: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        keyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        subId: "953",
        callbackGasLimit: "500000",
        mintFees: ethers.utils.parseEther("0.02"),
        priceFeedsAddress: "0x694AA1769357215DE4FAC081bf1f309aDC325306"
    },

    31337: {
        name: "hardhat",
        keyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        callbackGasLimit: "500000",
        mintFees: ethers.utils.parseEther("0.02")
    }
}

const localNetworks = ["localhost", "hardhat"];

module.exports = { networkConfig, localNetworks };