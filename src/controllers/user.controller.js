import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

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
        throw new ApiError(400, "email is required")
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
            $unset:{
                refreshToken: 1
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
        console.log(decode)
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

const changePassword = asyncHandler(async(req,res) => {
    const {oldPassword, newPassword, conformPassword} = req.body

    if(conformPassword !== newPassword){
        throw new ApiError(401, "New and conform password isn't matched")
    }
    
    const user = await User.findById(req.user?._id)
    // below is the model method not a mongoDB method
    const iscorrect = await user.isPasswordCorrect(oldPassword)
    console.log(iscorrect)
    if(!iscorrect){
        throw new ApiError(400, "Invalid Old Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed Successfully"))
})

const getUser = asyncHandler(async(req,res) => {
    const user = req.user
    return res
    .status(200)
    .json(new ApiResponse(200,{user},"Current User Feteched Successfully"))
})

const updateAccountDetail = asyncHandler(async(req,res) => {
    const {firstname,lastname,email} = req.body

    if(!firstname || !lastname || !email){
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                firstname,
                lastname,
                email
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated"))
})

const updateUserAvatar = asyncHandler(async(req,res) => {
    const localPath = req.file?.path

    if(!localPath){
        throw new ApiError(400, "Avatar File is Missing")
    }

    const avatar = await uploadOnCloudinary(localPath)
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user, "Avatar Image updated Successfully")
    )
})

const updateCoverImage = asyncHandler(async(req,res) => {
    const localPath = req.file?.path

    if(!localPath){
        throw new ApiError(400, "coverImage File is Missing")
    }

    const coverImage = await uploadOnCloudinary(localPath)
    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading coverImage on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user, "coverImage updated Successfully")
    )
})

const getUserChannelProfile = asyncHandler(async(req,res) => {
    const {username} = req.params
    
    if(!username?.trim()){
        throw new ApiError(400, "username is missing")
    }

    const channelInfo = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount:{
                    $size: "$subscribers"
                },
                channelCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                    then: true,
                    else: false
                }
            }
        },
        {
            $project:{
                username: 1,
                firstname: 1,
                lastname: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                channelCount: 1,
                isSubscribed: 1
            }
        }
    ])
    console.log(channelInfo)
    
    if(!channelInfo?.length){
        throw new ApiError(404, "Channel doesn't exist")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, channelInfo[0], "User Channel info Fetched Successfully")
    )
})

const getWatchHistory = asyncHandler(async(req,res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        avatar: 1,
                                        firstname: 1,
                                        lastname: 1,
                                        username: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner: {
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }  
    ])

    return res.status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory,"Watch History fetched successfully")
    )

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getUser,
    updateAccountDetail,
    updateUserAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
}