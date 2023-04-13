const path = require("path");
const fs = require("fs");

async function getSVGImages(imagesFilePath) {
    const fullPath = path.resolve(imagesFilePath);
    const files = fs.readdirSync(fullPath);

    const svgImages = [];

    for (let i in files) {
        const image = fs.readFileSync(`${fullPath}/${files[i]}`, "utf-8");
        svgImages.push(image);
    }

    return svgImages;
}

function svgImagesToBase64(imagesFilePath) {
    const myPath = path.resolve(imagesFilePath);
    const files = fs.readdirSync(myPath);

    const responses = [];

    for (let i in files) {
        const svgToBase64Form = fs.readFileSync(`${myPath}/${files[i]}`, "base64");
        responses.push(`data:image/svg+xml;base64,${svgToBase64Form}`);
    }

    return responses;
}


module.exports = { getSVGImages, svgImagesToBase64 };