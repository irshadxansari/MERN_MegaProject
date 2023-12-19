import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localfilepath) => {
    try {
        // check if local file path exist or not
        if(!localfilepath) return null;
        
        // upload the file on cloudinary
        const response = await cloudinary.v2.uploader.upload(localfilepath,{
            resource_type: "auto"
        })

        // file has been uploaded successfully
        console.log("File uploaded successfully ", response);
        return response;

    } catch (error) {
        // remove the file which is locally saved temporary while uploading operation
        fs.unlinkSync(localfilepath) 
        return null;
    }
}

export {uploadOnCloudinary}