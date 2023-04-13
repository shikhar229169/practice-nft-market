const pinataSDK = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);

const kitty = {
    name: "",
    description: "A cute kitty, playful and cheerful.",
    image: "",
    attributes: {
        mood: "happy happy happy",
        face: "cute"
    }
}

async function pinImages(imagesFilePath) {
    const imagesPath = path.resolve(imagesFilePath);
    const files = fs.readdirSync(imagesPath);
    const imageURI = [];
    const JSON_URI = [];

    for (let i in files) {
        const imageStream = fs.createReadStream(`${imagesFilePath}/${files[i]}`);
        const options = {
            pinataMetadata: {
                name: files[i]
            }
        }

        const response = await pinata.pinFileToIPFS(imageStream, options);

        imageURI.push(`ipfs://${response.IpfsHash}`);

        const currKitty = { ...kitty };
        currKitty.name = files[i].replace(".jpg", "");
        currKitty.image = imageURI[i];

        const JSON_Ipfs_Hash = await pinMetadata(currKitty);
        JSON_URI.push(`ipfs://${JSON_Ipfs_Hash}`);
    }
    
    console.log(JSON_URI);
    return JSON_URI;
}

async function pinMetadata(metadata) {
    const options = {
        pinataMetadata: {
            name: metadata.name
        }
    };

    const response = await pinata.pinJSONToIPFS(metadata, options);
    return response.IpfsHash;
}

module.exports = { pinImages };