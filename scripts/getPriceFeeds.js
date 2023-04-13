const { ethers } = require("hardhat");

async function main() {
    const priceFeeds = await ethers.getContractAt("AggregatorV3Interface", "0x694AA1769357215DE4FAC081bf1f309aDC325306");
    const { answer } = await priceFeeds.latestRoundData();
    console.log(answer.toString());
}

main();