const { ethers, network } = require("hardhat");
const { localNetworks } = require("../helper-hardhat-config.js");

const BASE_FEE = ethers.utils.parseEther("0.25");
const GAS_PRICE_LINK = "1000000000";

module.exports = async({ deployments, getNamedAccounts }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    
    if (localNetworks.includes(network.name)) {
        log("Deploying Mocks...");

        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINK]
        });
    }
}

module.exports.tags = ["randomNFT", "mocks"];