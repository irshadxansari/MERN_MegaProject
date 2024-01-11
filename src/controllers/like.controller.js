import { Like } from "../models/like.models.js";
import { Video } from "../models/video.models.js";
import {isValidObjectId} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toogleVideoLike = asyncHandler(async(req,res) => {
    // fetch the video Id from request parameter 
    const {videoId} = req.params

    // valid the video id
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }

    try {
        // find the document from the Like Schema by using videoId and liked User
        const like = await Like.findOne({ video: videoId, likedBy: req.user._id})
        
        if(like){
            //unlike the video
            await Like.findOneAndDelete({ video: videoId, likedBy: req.user._id})

            // return sucess response
            return res
            .status(200)
            .json(new ApiResponse(200, {}, "Unliked Video Successfully"))
        } else {
            // like the video
            const newLike = new Like({
                video: videoId,
                likedBy: req.user._id
            })

            // save into the db
            await newLike.save()

            // return success response
            return res
            .status(200)
            .json(new ApiResponse(200, {newLike}, "Liked Video Successfully"))
        }

    } catch (error) {
        throw new ApiError(500,"Something went wrong while Toggling video like")
    }
})

const toogleCommentLike = asyncHandler(async(req,res) => {
    // fetch the comment id from request parameter
    const {commentId} = req.params

    // validate the comment id
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid Comment Id")
    }

    try {
        // find the document from db by using comment id and Liked User
        const like = await Like.findOne({ comment: commentId, likedBy: req.user._id})

        if(like){

            // unlike the comment
            await Like.findOneAndDelete({comment: commentId, likedBy: req.user._id}) 

            // send success response
            return res
            .status(200)
            .json(new ApiResponse(200, {}, "Unliked Comment Successfully"))

        } else {
            // like the comment
            const newLike = new Like({
                comment: commentId,
                likedBy: req.user._id
            })

            // save into the db
            await newLike.save()

            // send success response
            return res
            .status(200)
            .json(new ApiResponse(200, {newLike}), "Liked Comment Successfully")
        }

    } catch (error) {
        throw new ApiError(500,"Something went wrong while Toogling the comment like")
    }
})

const toogleTweetLike = asyncHandler(async(req,res) => {
    // fetch the tweet id from request parameter
    const {tweetId} = req.params

    // validate the tweetId
    try {

        if(!isValidObjectId(tweetId)){
            throw new ApiError(400, "Invalid Tweet Id")
        }
    
        // search the document from like schema by using tweetid and liked User
        const like = await Like.findOne({ tweet: tweetId, likedBy:req.user._id})

        console.log(like)
        // if already liked then unlinked the post
        if(like){

            // Unlike the tweet
            await Like.findOneAndDelete({tweet: tweetId, likedBy:req.user._id})

            // send success response
            return res
            .status(200)
            .json(new ApiResponse(200, {}, "Unlike Tweet"))

        } else {

            // like the tweet
            const newLike = new Like({
                tweet: tweetId,
                likedBy: req.user._id
            })
            
            // then save into db
            await newLike.save()
            
            // send success response
            return res
            .status(200)
            .json(new ApiResponse(200, {newLike}, "Liked Tweet"))
        }
    } catch (error) {
        throw new ApiError(500,"Something went wrong while toogling tweet like")
    }
})

const getLikedVideo = asyncHandler(async(req,res) => {
    
    // fetching the document from database on the basis of video and likeduser
    const userLikedVideo = await Like.find({video:{$exists:true}, likedBy: req.user._id})

    // find the all liked video Id and store in array
    const videoId = userLikedVideo.map(like => like.tweet)

    // find the all video by videoId 
    const videos = await Video.find({_id: {$in : videoId}})

    try {
        // return success response
        return res
        .status(200)
        .json(new ApiResponse(200, {videos}, "All Liked Video Fetch Successfully"))
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching all Liked Video")
    }
})

export {
    toogleVideoLike,
    toogleCommentLike,
    toogleTweetLike,
    getLikedVideo
}