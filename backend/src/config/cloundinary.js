import { v2 as cloudinary } from 'cloudinary'
import { ENV } from './env.js'

cloudinary.config({
    api_key: ENV.CLOUDINARY_API_KEY,
    cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
    api_secret: ENV.CLOUDINARY_SECRET_KEY
})

export default cloudinary;