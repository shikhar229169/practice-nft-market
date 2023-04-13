const { network } = require("hardhat");
const { localNetworks } = require("../helper-hardhat-config.js");

const DECIMALS = 8;
const INITIAL_ANSWER = 2000000000;

module.exports = async({ deployments, getNamedAccounts }) => {
    if (localNetworks.includes(network.name)) {
        const { deploy, log } = deployments;
        const { deployer } = await getNamedAccounts();

        log("Deploying Mocks...");

        await deploy("MockV3Aggregator", {
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER]
        });
    }
}

module.exports.tags = ["dynamicNFT", "mocks"];