const { ethers, network } = require("hardhat");
const { networkConfig, localNetworks } = require("../helper-hardhat-config.js");
const { getSVGImages } = require("../utils/svgImagesHandling.js");
const { verifyContract } = require("../utils/verify.js");
require("dotenv").config();

const imagesFilePath = "./images/dynamicNFT";

module.exports = async({ deployments, getNamedAccounts }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    let priceFeedsAddress;
    const mintFees = networkConfig[chainId].mintFees;

    if (localNetworks.includes(network.name)) {
        const aggregatorV3Interface = await ethers.getContract("MockV3Aggregator", deployer);
        priceFeedsAddress = aggregatorV3Interface.address;
    }
    else {
        priceFeedsAddress = networkConfig[chainId].priceFeedsAddress;
    }

    const svgImages = await getSVGImages(imagesFilePath);

    const args = [priceFeedsAddress, mintFees, svgImages[1], svgImages[0]];

    const dynamicNFT = await deploy("dynamicNFT", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: network.config.blockConfirmations || 1
    });

    if (!localNetworks.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verifyContract(dynamicNFT.address, args);
    }
}

module.exports.tags = ["dynamicNFT"];