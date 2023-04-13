const { ethers, network, deployments, getNamedAccounts } = require("hardhat");
const { networkConfig, localNetworks } = require("../../helper-hardhat-config.js");
const { svgImagesToBase64 } = require("../../utils/svgImagesHandling.js");
const { assert, expect } = require("chai");

const tokenURITemplate = {
    name: "",
    description: "",
    image: ""
}

!localNetworks.includes(network.name)
    ? describe.skip
    : describe("Dynamic NFT Testing", () => {
        let dynamicNFT;
        let priceFeeds;
        let deployer;
        let mintFees;
        const chainId = network.config.chainId;

        beforeEach(async() => {
            await deployments.fixture(["dynamicNFT"]);
            deployer = (await getNamedAccounts()).deployer;

            dynamicNFT = await ethers.getContract("dynamicNFT", deployer);
            priceFeeds = await ethers.getContract("MockV3Aggregator");

            mintFees = dynamicNFT.getMintFees();
        })

        describe("Constructor Testing", async() => {
            it("Token Counter initialized to zero, Mint Fees is set up correctly and priceFeedsAddress is correct", async() => {
                const tokenCounter = await dynamicNFT.getTokenCounter();
                const mintFees = await dynamicNFT.getMintFees();
                const priceFeedsAddress = await dynamicNFT.getPriceFeedsAddress();

                assert.equal(tokenCounter.toString(), "0");
                assert.equal(mintFees.toString(), networkConfig[chainId]["mintFees"]);
                assert.equal(priceFeedsAddress, priceFeeds.address);
            })

            it("SVG Images are set up correctly in their correct base64 format", async() => {
                const contractHappyURI = await dynamicNFT.getHappyImageURI();
                const contractSadURI = await dynamicNFT.getSadImageURI();

                const correctSVGBase64 = svgImagesToBase64("./images/dynamicNFT");

                assert.equal(contractSadURI, correctSVGBase64[1]);
                assert.equal(contractHappyURI, correctSVGBase64[0]);
            })
        })

        describe("Mint NFT Testing", () => {
            const highValue = "2000000"

            it("Reverts if less eth sent", async() => {
                await expect(dynamicNFT.mintNFT("123")).to.be.revertedWith("dynamicNFT__lessETH");
            })

            it("NFT is minted for the requester with correct tokenId and the tokenCounter is incremented", async() => {
                const tokenId = await dynamicNFT.getTokenCounter();
                const initialBalance = await dynamicNFT.balanceOf(deployer);

                await dynamicNFT.mintNFT(highValue, { value: mintFees });

                const tokenCounter = await dynamicNFT.getTokenCounter();
                const finalBalance = await dynamicNFT.balanceOf(deployer);
                const owner = await dynamicNFT.ownerOf(tokenId);
                const ownerHighValue = await dynamicNFT.getTokenIdToHighValue(tokenId);
                
                assert.equal(deployer, owner);
                assert.equal(tokenCounter.toString(), tokenId.add(1).toString());
                assert.equal(finalBalance.toString(), initialBalance.add(1).toString());
                assert.equal(highValue, ownerHighValue);
            })

            it("Event is emitted on successful NFT Mint", async() => {
                const tokenId = await dynamicNFT.getTokenCounter();
                await expect(dynamicNFT.mintNFT(highValue, { value: mintFees })).to.emit(dynamicNFT, "NFTMinted").withArgs(deployer, tokenId);
            })
        })

        describe("Token URI Function Testing", () => {
            it("Token URI should be set according to the price feeds", async() => {
                const highValue = "200000";

                const tokenId = await dynamicNFT.getTokenCounter();
                await dynamicNFT.mintNFT(highValue, { value: mintFees });

                const tokenURI = await dynamicNFT.tokenURI(tokenId);
                let correctTokenURI = { ...tokenURITemplate };

                const happyImageURI = await dynamicNFT.getHappyImageURI();
                const sadImageURI = await dynamicNFT.getSadImageURI();

                const { answer } = await priceFeeds.latestRoundData();

                if (answer >= highValue) {
                    correctTokenURI.name = "do pal khushi ke";
                    correctTokenURI.description = "Me bolu meow meow mere he char paw";
                    correctTokenURI.image = happyImageURI;
                }
                else {
                    correctTokenURI.name = "ye gam khatam khae nhi hota",
                    correctTokenURI.description = "Zindgi kesi he paheli, kabhi ye hasae kabhi ye rulae",
                    correctTokenURI.image = sadImageURI;
                }

                correctTokenURI = JSON.stringify(correctTokenURI);
                
                correctTokenURI = `data:application/json;base64,${Buffer.from(correctTokenURI).toString("base64")}`;

                assert.equal(tokenURI, correctTokenURI);
            })
        })

        describe("Change High Value Testing", () => {
            const oldHighValue = "1234";
            const newHighValue = "12345";

            it("Reverts if tokenId doesn't exist", async() => {
                await expect(dynamicNFT.changeHighValue(1, "123")).to.be.revertedWith("dynamicNFT__invalidTokenId");
            })

            it("Reverts if caller is not the owner", async() => {
                const tokenId = await dynamicNFT.getTokenCounter();
                await dynamicNFT.mintNFT(oldHighValue, { value: mintFees });

                const attacker = (await ethers.getSigners())[1];
                const attack = await dynamicNFT.connect(attacker);

                await expect(attack.changeHighValue(tokenId, newHighValue)).to.be.revertedWith("dynamicNFT__notOwner");
            })

            it("Changes if caller is the owner", async() => {
                const tokenId = await dynamicNFT.getTokenCounter();
                await dynamicNFT.mintNFT(oldHighValue, { value: mintFees });

                await dynamicNFT.changeHighValue(tokenId, newHighValue);

                const fetchedHighValue = await dynamicNFT.getTokenIdToHighValue(tokenId);

                assert.equal(newHighValue, fetchedHighValue.toString());
            })

            it("Event is emitted upon successful change", async() => {
                const tokenId = await dynamicNFT.getTokenCounter();
                await dynamicNFT.mintNFT(oldHighValue, { value: mintFees });

                await expect(dynamicNFT.changeHighValue(tokenId, newHighValue)).to.emit(dynamicNFT, "highValueChanged").withArgs(tokenId, oldHighValue, newHighValue);
            })
        })

        describe("Withdraw Function Testing", async() => {
            it("Reverts if caller is not the owner", async() => {
                const attacker = (await ethers.getSigners())[1];
                const attack = await dynamicNFT.connect(attacker);

                await expect(attack.withdraw()).to.be.revertedWith("dynamicNFT__notOwner");
            })

            it("Reverts if balance is zero", async() => {
                await expect(dynamicNFT.withdraw()).to.be.revertedWith("dynamicNFT__zeroBalance");
            })

            it("Owner receives the withdrawal amount if every condition is successful", async() => {
                const customer = (await ethers.getSigners())[2];
                const customerInstance = await dynamicNFT.connect(customer);
                const highValue = "200000";

                await customerInstance.mintNFT(highValue, { value: mintFees });

                const contractBalance = await dynamicNFT.provider.getBalance(dynamicNFT.address);
                const deployerInitialBalance = await dynamicNFT.provider.getBalance(deployer);

                const response = await dynamicNFT.withdraw();
                const receipt = await response.wait(1);

                const deployerFinalBalance = await dynamicNFT.provider.getBalance(deployer);
                const netGasFees = (receipt.gasUsed).mul(receipt.effectiveGasPrice);

                assert.equal(deployerFinalBalance.toString(), deployerInitialBalance.add(contractBalance).sub(netGasFees).toString());
            })
        })
    })