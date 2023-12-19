import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req,res) => {
    // get the detail of user from frontend
    // validate - if required field is empty
    // check if user already exists : username, email
    // check for images , check for avatar
    // upload them to cloudinary, check for avatar
    // create a user object
    // create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response

    const {username, fullname, email, password} = req.body
    
    if(
        [username,fullname,email,password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or : [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarPath = req.files?.avatar[0]?.path;
    const coverPath = req.files?.coverImage[0]?.path;

    if(!avatarPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarPath)
    const coverImage = await uploadOnCloudinary(coverPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullname,
        email,
        password,
        username,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    })

    if(!user){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    user = user.toObject()
    user.password = undefined
    user.refreshToken = undefined

    return res.status(201).json(
        new ApiResponse(200, user, "User Registered Successfully")
    )

})

export {registerUser}