import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async(req,res) => {
    // fetch the video id from request parameter
    const {videoId} = req.params

    // validate the video id
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Id")
    }

    // fetch the option from request query
    const {page = 1, limit = 10} = req.query

    // create a paginate option for result
    const options = {
        // since we are receiving in string so converting into interger
        page: parseInt(page),
        limit: parseInt(limit)
    }
    const result = await Comment.aggregatePaginate([
        {
            // match the comment with video id
            $match:{
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "owner"
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                "owner.firstname": 1,
                "owner.lastname": 1,
                "owner.username": 1,
                "owner.avatar": 1,
            }
        },
        {
            // sorting comments by 'createdAt' in descending order
            $sort: {
                createdAt: -1
            }
        }
    ],
    options
    )

    console.log(result)

    // return success response
    return res
    .status(200)
    .json( new ApiResponse(200, {result}, "Video Comment fetched Successfully"))
    
})

const addComment = asyncHandler(async(req,res) => {
    // fetch the video id from req parameter
    const {videoId} = req.params

    // validate the video id
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }

    // fetch the content from request body
    const {content} = req.body

    // validate the content
    if(!content){
        throw new ApiError(400, "Content can't be empty")
    }

    // create a entry in db
    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    // if comment is empty then thow an error
    if(!comment){
        throw new ApiError(500, "Something went wrong while creating comment")
    }

    // return success response
    return res
    .status(200)
    .json( new ApiResponse(200, {comment}, "Comment Added Successfully"))
})

const updateComment = asyncHandler(async(req,res) => {

    // fetch the comment Id from request params
    const {commentId} = req.params

    // validate the video id
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Comment Id")
    }

    // get the content of comment from req body
    const {content} = req.body
    
    // validate the content
    if(!content){
        throw new ApiError(400, "content is required")
    }

    // find the comment and update it new content
    const updatecomment = await Comment.findByIdAndUpdate(
        {_id:commentId},
        {content},
        {new: true}
    )

    // check if updatecomment is empty then thorw an error
    if(!updatecomment){
        throw new ApiError(400, "Something went wrong while updating comment")
    }

    // return success response
    return res
    .status(200)
    .json( new ApiResponse(200, {updatecomment}, "Comment updated Successfully"))
})

const deleteComment = asyncHandler(async(req,res) => {
    // fetch the comment id from request paramter
    const {commentId} = req.params

    // validate the comment id
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Comment Id")
    }

    // find the document and delete
    const removeComment = await Comment.findOneAndDelete(
        {_id: commentId, owner: req.user._id}
    )

    // if removeComment is null then throw an error
    if(!removeComment){
        throw new ApiError(400, "Something went wrong while deleting comment")
    }

    // return success response
    return res
    .status(200)
    .json( new ApiResponse(200, {}, "Comment Deleted Successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}