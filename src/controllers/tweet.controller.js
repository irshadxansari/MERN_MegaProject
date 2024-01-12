import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { isValidObjectId } from "mongoose";

const createTweet = asyncHandler( async(req,res) => {
    try {
        // fetch the data came from request body
        const {content} = req.body;
    
        // validate perform on content
        if(!content){
            throw new ApiError(400,"Content Can't be empty")
        }
        
        // create a new Tweet in db
        const newTweet = await Tweet.create({
            content,
            owner: req.user._id
        })

        newTweet.owner = undefined

        // check if tweet save properly
        if(!newTweet){
            throw new ApiError(500, "Something went wrong while creating a tweet")
        }
        
        // sending successfull response
        return res.status(200).json(
        new ApiResponse(200, {newTweet}, "Tweet Created Sucessfully")
    )
        
    } catch (error) {
        throw new ApiError(500,"Cannot create a tweet")
    }
})

const getUserTweet = asyncHandler( async(req,res) => {
    // fetch the user id from request parameter
    const {userId} = req.params

    // validate the user id
    if(!isValidObjectId(userId)){
        throw new ApiError((400), "Invalid User Id")
    }

    // check if the user not exist in database
    if(!(await User.findById({_id:userId}))){
        throw new ApiError(404, "User not found")
    }

    // find all the tweet for a given user id
    const allTweet = await Tweet.find({owner:userId}).select('id content')

    // if error occured then
    if(!allTweet){
        throw new ApiError(500, "Something went wrong while retriving all tweet")
    }

    console.log(allTweet)

    // return success response
    return res
    .status(200)
    .json(new ApiResponse(200,{allTweet},"All Tweet Fetched Successfully of user"))
})

const updateTweet = asyncHandler( async(req,res) => {
    // fetch content from the request body
    const {content} = req.body

    // check if content is empty then throw an error
    if(!content){
        throw new ApiError(400, "Content can't be empty");
    }

    // fetch tweet id from the request parameter
    const {tweetId} = req.params

    // validate the tweet id
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid Tweet Id")
    }
    
    // check if tweet exist or not for a given tweet id
    const updateTweet = await Tweet.findOneAndUpdate(
            {_id:tweetId, owner:req.user._id},
            {content},
            {new: true}
        ).select('id content')

    // if no tweet exist then throw an error
    if(!updateTweet){
        throw new ApiError(400, "Something went wrong while updating the tweet")
    }

    // return success response
    return res
    .status(200)
    .json(new ApiResponse(200,{updateTweet},"Tweet Updated Successfully"))
})

const deleteTweet = asyncHandler( async(req,res) => {
    try {
        // fetch the tweet id from request paramater
        const {tweetId} = req.params

        // validate the tweet id
        if(!isValidObjectId(tweetId)){
            throw new ApiError(400, "Invalid Tweet Id")
        }
    
        // fetch the document using tweet id check the owner and thedelete it
        await Tweet.findOneAndDelete({_id:tweetId, owner:req.user._id})

        // send success response
        return res
        .status(200)
        .json(new ApiResponse(200),{}, "Tweet Deleted Sucessfully")
    } catch (error) {
        throw new ApiError(500, "Something went wrong while deleting the tweet")
    }
})

export {
    createTweet,
    getUserTweet,
    updateTweet,
    deleteTweet
}