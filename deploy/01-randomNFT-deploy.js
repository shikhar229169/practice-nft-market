const { ethers, network } = require("hardhat");
const { networkConfig, localNetworks } = require("../helper-hardhat-config.js");
const { verifyContract } = require("../utils/verify.js");
const { pinImages } = require("../utils/pinataNFTPinning.js");
require("dotenv").config();

const imagesFilePath = "./images/randomNFT";

module.exports = async({ deployments, getNamedAccounts }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    let vrfCoordinatorAddress;
    let vrfCoordinator;
    const keyHash = networkConfig[chainId].keyHash;
    let subId;
    let callbackGasLimit = networkConfig[chainId].callbackGasLimit;
    let mintFees = networkConfig[chainId].mintFees;
    let URIs;
    let chances;

    if (localNetworks.includes(network.name)) {
        // deploy VRF Coordinator mock
        vrfCoordinator = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
        vrfCoordinatorAddress = vrfCoordinator.address;
        const response = await vrfCoordinator.createSubscription();
        const receipt = await response.wait(1);

        subId = receipt.events[0].args.subId;

        await vrfCoordinator.fundSubscription(subId, ethers.utils.parseEther("1000"));
    }
    else {
        vrfCoordinatorAddress = networkConfig[chainId].vrfCoordinatorAddress;
        subId = networkConfig[chainId].subId;
    }

    if (process.env.UPLOAD_TO_PINATA == "true") {
        URIs = await pinImages(imagesFilePath);
    }
    else {
        URIs = [
            'ipfs://Qmcv9sh3uaFMQmSZVDpz1i13pQLbrixFcq7JydRdSgsnQn',
            'ipfs://QmRHMfsaZhkmWJCnnWMYtDmn7Z93Sm8qUFuBwMgAHHenkq',
            'ipfs://QmRVbeDVbLMDpH13rbzbEcJsgL1SFDuiKuV859rZgXSV1D',
            'ipfs://QmQQaBPAvjRBgrv1B9iBdQXuwKSJwVP8G55CYnW2uuRPqA'
        ];
    }

    // angora- 0 to 19, munchkin- 20 to 49, persian- 50 to 59, turkishVan- 60 to 99
    chances = [20, 50, 60, 100]

    const args = [vrfCoordinatorAddress, URIs, chances, keyHash, subId, callbackGasLimit, mintFees];

    const randomNFT = await deploy("randomNFT", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: network.config.blockConfirmations
    });

    if (localNetworks.includes(network.name)) {
        await vrfCoordinator.addConsumer(subId, randomNFT.address);
    }

    if (!localNetworks.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verifyContract(randomNFT.address, args);
    }
}

module.exports.tags = ["randomNFT", "main"];