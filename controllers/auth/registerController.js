import Joi from 'joi';
import { RefreshToken, User } from '../../models';
import bcrypt from 'bcrypt';
import JwtService from '../../services/JWTService';
import CustomErrorHandler from '../../services/CustomErrorHandler';
import { REFRESH_SECRET } from '../../config';


const registerController = {
    async register(req, res, next) {


        // ? Create schema for validation
        const registerSchema = Joi.object({
            name: Joi.string().min(3).max(30).required(),

            email: Joi.string().email().required(),

            password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),

            repeat_password: Joi.ref('password')
        })

        // console.log(req.body)
        const { error } = registerSchema.validate(req.body)

        if (error) {
            return next(error);
        }

        // ? check if user already in database
        try {
            const exist = await User.exists({ email: req.body.email })
            if (exist) {
                return next(CustomErrorHandler.alreadyExist('This Email is already registered'));
            }
        } catch (error) {
            return next(error);
        }

        // ? Prepare the model
        const { name, email, password } = req.body
        // ? Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword
        })

        let access_token;
        let refresh_token;
        try {
            const result = await user.save()
            // console.log(result)

            //? token
            access_token = JwtService.sign({ _id: result._id, role: result.role })
            refresh_token = JwtService.sign({ _id: result._id, role: result.role }, '1y', REFRESH_SECRET)

            // ? Database whitelist
            await RefreshToken.create({ token: refresh_token })

        } catch (err) {
            return next(err)
        }


        res.json({  access_token, refresh_token})
    }
}

export default registerController;