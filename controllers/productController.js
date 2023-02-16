import { Product } from "../models";
import multer, { diskStorage } from "multer";
import path from "path";
import CustomErrorHandler from "../services/CustomErrorHandler";
import Joi from "joi";
import fs from "fs";


const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);

    }
});


const handleMultipartData = multer({ storage, limits: { fileSize: 1000000 * 20 } }).single('image');
const productController = {
    async store(req, res, next) {
        // ? Multipart form data
        handleMultipartData(req, res, async (err) => {
            if (err) {
                return next(CustomErrorHandler.serverError(err.message));
            }
            // console.log(req.file)
            const filePath = req.file.path
            // ? validate request
            const productSchema = Joi.object({
                name: Joi.string().required(),
                price: Joi.number().required(),
                size: Joi.string().required(),

            });

            const { error } = productSchema.validate(req.body)

            if (error) {
                // ? Delete uploaded file
                // ? Rootfolder/uploaded/filename.png
                fs.unlink(`${appRoot}/${filePath}/upload}`, (err) => {
                    return next(CustomErrorHandler.serverError(err.message));
                });

                return next(error);
            }
            const { name, price, size } = req.body;

            let document;
            try {
                document = await Product.create({
                    name,
                    price,
                    size,
                    image: filePath,
                });
            } catch (error) {
                return next(error);
            }
            res.status(201).json(document)
        })
    }
}
export default productController;