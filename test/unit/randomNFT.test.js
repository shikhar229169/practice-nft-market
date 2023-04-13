const { ethers, deployments, network, getNamedAccounts } = require("hardhat");
const { localNetworks, networkConfig } = require("../../helper-hardhat-config.js");
const { assert, expect } = require("chai");

!localNetworks.includes(network.name)
    ? describe.skip
    : describe("Random NFT Testing", () => {
        let randomNFT;
        let deployer;
        let vrfCoordinator;
        const chainId = network.config.chainId;
        let mintFees;

        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer;
            await deployments.fixture(["randomNFT"]);

            randomNFT = await ethers.getContract("randomNFT", deployer);
            vrfCoordinator = await ethers.getContract("VRFCoordinatorV2Mock", deployer);

            mintFees = await randomNFT.getMintFees();
        });

        describe("Constructor Testing", () => {
            it("vrfCoordinator is set correctly", async () => {
                const vrfCoordinatorAddress = await randomNFT.getVRFCoordinator();
                assert.equal(vrfCoordinatorAddress, vrfCoordinator.address);
            })

            it("Owner is same as deployer", async () => {
                const owner = await randomNFT.getOwner();

                assert.equal(owner, deployer);
            })

            it("Token Counter is set to zero", async () => {
                const tokenCounter = await randomNFT.getTokenCounter();
                assert.equal(tokenCounter.toString(), "0");
            })
        });

        describe("Cat Breed Function Testing", () => {
            it("Angora is selected for 0 to 19", async () => {
                for (let i = 0; i < 20; i++) {
                    const catBreed = await randomNFT.getCatBreed(i);
                    assert.equal(catBreed, "0");
                }
            })

            it("Munchkin is selected for 20 to 49", async () => {
                for (let i = 20; i < 50; i++) {
                    const catBreed = await randomNFT.getCatBreed(i);
                    assert.equal(catBreed, "1");
                }
            })

            it("Persian is selected for 50 to 59", async () => {
                for (let i = 50; i < 60; i++) {
                    const catBreed = await randomNFT.getCatBreed(i);
                    assert.equal(catBreed, "2");
                }
            })

            it("turkishVan is selected for 60 to 99", async () => {
                for (let i = 60; i < 100; i++) {
                    const catBreed = await randomNFT.getCatBreed(i);
                    assert.equal(catBreed, "3");
                }
            })

            it("Reverts if random number is out of range", async () => {
                await expect(randomNFT.getCatBreed(100)).to.be.revertedWith("randomNFT__breedNotFound");
            })
        });

        describe("Mint NFT Testing", () => {
            it("Reverts if less ETH sent", async () => {
                await expect(randomNFT.mintNFT()).to.be.revertedWith("randomNFT__lessETH");
            });

            it("Request Id generated, requester assigned to the req Id", async () => {
                const response = await randomNFT.mintNFT({ value: mintFees });
                const receipt = await response.wait(1);

                const reqId = receipt.events[1].args.requestId;
                const requester = await randomNFT.getReqIdToOwner(reqId);
                assert.equal(requester, deployer);
            });

            it("NFT Requested event is emitted", async () => {
                await expect(randomNFT.mintNFT({ value: mintFees })).to.emit(randomNFT, "NFTRequested");
            });
        });

        describe("Fulfill Random Words Testing for final random NFT Minting", () => {
            it("Everything happens man, I am tired!", async () => {
                let tokenId = await randomNFT.getTokenCounter();
                let initialBalance = await randomNFT.balanceOf(deployer);
                const mintResponse = await randomNFT.mintNFT({ value: mintFees });
                const mintReceipt = await mintResponse.wait(1);
                const reqId = mintReceipt.events[1].args.requestId;

                await new Promise(async (resolve, reject) => {
                    randomNFT.once("NFTMinted", async () => {
                        try {
                            const finalTokenCounter = await randomNFT.getTokenCounter();
                            const finalBalance = await randomNFT.balanceOf(deployer);
                            const owner = await randomNFT.ownerOf(tokenId);
                            const uri = await randomNFT.tokenURI(tokenId);

                            assert.equal(finalTokenCounter.toString(), tokenId.add(1).toString());
                            assert.equal(finalBalance.toString(), initialBalance.add(1).toString());
                            assert.equal(owner, deployer);
                            console.log(uri.toString());
                            
                            resolve();
                        }
                        catch (err) {
                            reject(err);
                        }
                    })

                    const response = await vrfCoordinator.fulfillRandomWords(reqId, randomNFT.address);
                    await response.wait(1);
                })
            })
        });

        describe("Withdraw Function Testing", () => {
            it("Reverts if caller is not the owner", async() => {
                const attacker = (await ethers.getSigners())[1];
                const attackerInstance = await randomNFT.connect(attacker);

                await expect(attackerInstance.withdraw()).to.be.revertedWith("randomNFT__notOwner");
            });
            
            it("Reverts if contract balance is zero", async() => {
                // initially no one bought the nft, therefore contract balance will be 0
                await expect(randomNFT.withdraw()).to.be.revertedWith("randomNFT__zeroBalance");
            });

            it("Allows owner to withdraw", async() => {
                const person = (await ethers.getSigners())[1];
                const customer = await randomNFT.connect(person);

                await customer.mintNFT({ value: mintFees });

                const initialContractBalance = await randomNFT.provider.getBalance(randomNFT.address);
                const initialBalance = await randomNFT.provider.getBalance(deployer);

                const response = await randomNFT.withdraw();
                const receipt = await response.wait(1);

                const finalBalance = await randomNFT.provider.getBalance(deployer);
                const netGasUsed = (receipt.effectiveGasPrice).mul(receipt.gasUsed);
                assert.equal(finalBalance.toString(), initialBalance.add(initialContractBalance).sub(netGasUsed).toString());
            })
        });

        describe("Callback Gas Limit Modify Function Testing", () => {
            it("Reverts if caller is not the owner", async() => {
                const attacker = (await ethers.getSigners())[1];
                const attackerInstance = await randomNFT.connect(attacker);

                await expect(attackerInstance.withdraw()).to.be.revertedWith("randomNFT__notOwner");
            });

            it("Allows owner to modify it", async() => {
                const newLimit = "696969";
                await randomNFT.changeCallbackGasLimit(newLimit);

                const changedLimit = await randomNFT.getCallbackGasLimit();

                assert.equal(changedLimit.toString(), newLimit.toString());
            })
        })
    })