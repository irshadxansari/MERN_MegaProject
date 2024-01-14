import {Subscription} from "../models/subscription.models.js"
import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.models.js"

const toogleSubscription = asyncHandler(async(req,res) => {

    // fetch the channel id from the request paramaters
    const {channelId} = req.params

    // validate the channel id
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid Channel Id")
    }

    try {
        // fetch the document on the bases of channel Id and user
        const channel = await Subscription.findOne({channel: channelId, subscriber:req.user._id})
    
        if(channel){
            // unsubscribe the channel
            await Subscription.findOneAndDelete({channel: channelId, subscriber:req.user._id})
    
            // return success response
            return res
            .status(200)
            .json(new ApiResponse(200, {}, "Channel Unsubscribed Successfully"))
        } else {
            // subscribe the channel and save into db
            const newChannelSubscriber = await Subscription.create({
                subscriber: req.user._id,
                channel: channelId
            })
    
            // return success response
            return res
            .status(200)
            .json(new ApiResponse(200, {newChannelSubscriber}, "Channel Subscribed Successfully"))
        }
    } catch (error) {
        throw new ApiError(500, "Internal Error while toogling subscription")
    }

})

const getUserChannelSubscribers = asyncHandler(async(req,res) => {

    // fetch the channel id from the request paramaters
    const {channelId} = req.params

    try {
        // validate the channelId
        if(!isValidObjectId(channelId)){
            throw new ApiError(400, "Invalid Channel Id")
        }
    
        // find the document from db using channel id
        const subscribed = await Subscription.find({channel: channelId}).select('subscriber')

        console.log(subscribed)

        // find the all channel user(subscriber) Id and store in an array
        const userId = subscribed.map(user => user.subscriber)

        // fetch all the user and populate by their username
        const userChannelSubscribers = await User.find({_id: {$in: userId}}).select('firstname lastname username avatar')

        // return success response
        return res
        .status(200)
        .json(new ApiResponse(200, {userChannelSubscribers}, "User Channel Subscribers Fetched Successfully"))

    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching user channel subscribers")   
    }
})

const getSubscribedChannels = asyncHandler(async(req,res) => {
    
    try {
        // fetch the subscriber id from request parameter
        const {subscriberId} = req.params
    
        // validate the subscriber id
        if(!isValidObjectId(subscriberId)){
            throw new ApiError(400, "Invalid Channel Id")
        }
    
        //find the document by using subscriber id
        const subscribedChannel = await Subscription.find({subscriber:subscriberId}).select('id channel')
        
        return res
        .status(200)
        .json(new ApiResponse(200, {subscribedChannel}, "Subscribed Channel fetched Successfully"))
    } catch (error) {
        throw new ApiError(500, "Internal server issue while fetching subscribed channel")
    }

})

export {
    toogleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}