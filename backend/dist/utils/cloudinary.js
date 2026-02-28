"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImage = exports.uploadImage = void 0;
const cloudinary_1 = require("cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadImage = async (filePath, folder) => {
    const result = await cloudinary_1.v2.uploader.upload(filePath, {
        folder: `turnolex/${folder}`,
        transformation: [{ width: 400, height: 400, crop: 'fill' }],
    });
    return result.secure_url;
};
exports.uploadImage = uploadImage;
const deleteImage = async (publicId) => {
    await cloudinary_1.v2.uploader.destroy(publicId);
};
exports.deleteImage = deleteImage;
exports.default = cloudinary_1.v2;
