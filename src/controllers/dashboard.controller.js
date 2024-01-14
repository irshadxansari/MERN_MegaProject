import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, {isValidObjectId} from "mongoose";

const getChannelStats = asyncHandler( async(req,res) => {
    try {
        // here user id and channel id is same
        // validate the channel id
        if(!isValidObjectId(req.user._id)){
            throw new ApiError(404, "Channel not Found")
        }
    
        // calculate statistics
        // 1. total video views
        let totalVideoViews = await Video.aggregate([
            {
                $match: {
                    owner : new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $group: { _id: null, totalviews: { $sum: "$views" } }
            }
        ])
    
        totalVideoViews = totalVideoViews[0].totalviews
        
        // 2.totalSubscribers or totalFollowers
        const totalSubscribers = await Subscription.countDocuments({channel: req.user._id})
        
        // 3. totalVideos
        const totalVideos = await Video.countDocuments({owner: req.user._id})
        
        // 4. totalLikes
        const video = await Video.find({owner: req.user._id}).select("_id")
        const likeId = video.map( like => like._id)
        const totalLikes = await Like.countDocuments({video: {$in: likeId}})
        
        // return success response
        return res
        .status(200)
        .json( new ApiResponse(
            200,
            {totalSubscribers, totalVideos, totalVideoViews,totalLikes}
        ))
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching channel stats")
    }
})

const getChannelVideos = asyncHandler( async(req,res) => {

    // validate the user id
    if(!isValidObjectId(req.user._id)){
        throw new ApiError(400, "Invalid User")
    }

    try {

        // fetch the video where owner is user
        const video = await Video.find(
            {owner: req.user._id}
        ).select("thumbnail title isPublished createdAt videoFile") //videoFile isn't necessary 

        // return success response
        return res
        .status(200)
        .json( new ApiResponse(200, {video}, "Channel Video Get Successfully"))

    } catch (error) {
        throw new ApiError(500, "Internal Error")
    }

})

export {
    getChannelStats,
    getChannelVideos
}