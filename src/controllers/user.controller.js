import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

// generate accesss and refresh token
const generateAccessandRefreshTokens = async(userId) => {
    try{
        const updateUser = await User.findById(userId)
        const accessToken = updateUser.generateAccessToken()
        const refreshToken = updateUser.generateRefreshToken()

        updateUser.refreshToken = refreshToken
        await updateUser.save({validateBeforeSave:false})

        return {accessToken,refreshToken}

    } catch(error){
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

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

    const {username, firstname, lastname, email, password} = req.body
    
    if(
        [username,firstname,lastname,email,password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    if(password.length < 8){
        throw new ApiError(400, "Password length at least 8")
    }

    const existedUser = await User.findOne({
        $or : [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarPath = req.files?.avatar[0]?.path;
    let coverPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverPath = req.files.coverImage[0].path
    }

    if(!avatarPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarPath)
    const coverImage = await uploadOnCloudinary(coverPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        firstname,
        lastname,
        email,
        password,
        username,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    })

    if(!user){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    user.password = undefined
    user.refreshToken = undefined

    return res.status(201).json(
        new ApiResponse(200, user, "User Registered Successfully")
    )

})

const loginUser = asyncHandler(async(req,res) => {
    // req.body -> data
    // username or email
    // find the user from db
    // if found check password
    // password match then generate refresh and access token
    // send cookie as a response

    const {email, password} = req.body;
    if(!email){
        throw new ApiError(400, "username or email is required")
    }

    let user = await User.findOne({email})

    if(!user){
        throw new ApiError(404, "user doesn't exits")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if(!isPasswordCorrect){
        throw new ApiError(404, "Invalid Password")
    }

    const {accessToken, refreshToken} = await generateAccessandRefreshTokens(user._id)

    user.password = undefined
    user.refreshToken = undefined

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: user, accessToken, refreshToken
            },
            "User Logged In Successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req,res) => {
    const user = await User.findByIdAndUpdate(
        {_id: req.user._id},
        {
            $set:{
                refreshToken: ""
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{user}, "User Logged Out"))
})

const refreshAccessToken = asyncHandler(async(req,res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
        if(!incomingRefreshToken){
            throw new ApiError(401,"unauthorized request")
        }
    
        const decode = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decode?._id)
    
        if(!user){
            throw new  ApiError(401, "Invalid refresh Token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token is expired or already used")
        }
    
        const {accessToken,refreshToken} = await generateAccessandRefreshTokens(user?._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken",accessToken, options)
        .cookie("refreshToken",refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken},
                "Acess Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}