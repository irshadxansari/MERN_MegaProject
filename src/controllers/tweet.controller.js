import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";

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

    // if user id empty then throw errow
    if(!userId){
        throw new ApiError((400), "User id is missing from parameter")
    }

    // check if the user not exist in database
    if(!(await User.findById({_id:userId}))){
        throw new ApiError(404, "User not found")
    }

    // find all the tweet for a given user id
    const allTweet = await Tweet.find({owner:userId})

    console.log(allTweet)

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

    // check if tweet id is empty
    if(!tweetId){
        throw new ApiError(400, "Id Paramater is Missing")
    }
    
    // check if tweet exist or not for a given tweet id
    let tweet = await Tweet.findById({_id:tweetId})

    // if no tweet exist then throw an error
    if(!tweet){
        throw new ApiError(404, "Tweet not found");
    }

    // check if currently logged user is not owner of a tweet
    if(String(tweet.owner) !== String(req.user._id)){
        throw new ApiError(400, "Can't be Update Tweet")
    }

    // then update the tweet and push into the database
    tweet.content = content
    await tweet.save({validateBeforeSave:false})

    tweet.owner = undefined
    console.log(tweet)

    if(!tweet){
        throw new ApiError(500,"Error while updating the Tweet")
    }
    
    return res
    .status(200)
    .json(new ApiResponse(200,{tweet},"Tweet Updated Successfully"))
})

const deleteTweet = asyncHandler( async(req,res) => {
    // fetch the tweet id from request paramater
        const {tweetId} = req.params
    
        console.log(tweetId)

        // if tweet id is empty then throw error
        if(!tweetId){
            throw new ApiError(400,"Id parameter is missing")
        }
    
        // checking whether tweet exist for a given tweet id
        const tweet = await Tweet.findById({_id:tweetId})

        if(!tweet){
            throw new ApiError(404,"Tweet not found")
        }

        console.log(String(tweet.owner))
        console.log(String(req.user._id))

        // checking currently logged user is the owner of tweet or not
        if(String(tweet.owner) !== String(req.user._id)){
            throw new ApiError(400, "Can't Delete the Tweet")
        }

        // if currently logged user is owner then delete the post
        await Tweet.findByIdAndDelete({_id: tweetId})

        // send success response
        return res
        .status(200)
        .json(new ApiResponse(200),{}, "Tweet Deleted Sucessfully")
})

export {
    createTweet,
    getUserTweet,
    updateTweet,
    deleteTweet
}