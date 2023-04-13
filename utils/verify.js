const { run } = require("hardhat");

async function verifyContract(contractAddress, args) {
    try {
        console.log("Verifying the Contract...");

        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args
        });

        console.log("Voilla! Your contract is verified successfully");
    }   
    catch (err) {
        if (err.message.toLowerCase().includes("already verified")) {
            console.log("Your are all set, your contract is already verified!");
        }
        else {
            console.log(err);
        }
    }
}

module.exports = { verifyContract };