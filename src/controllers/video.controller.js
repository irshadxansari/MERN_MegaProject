import {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {

    // fetch the title and description of video from request body
    const { title, description} = req.body

    // validate on title and description
    if(!title || !description){
        throw new ApiError(404, "required all fields")
    }

    // fetch the video and thumbnail from request files
    const videoPath = req.files?.videoFile[0]?.path
    const thumbnailPath = req.files?.thumbnail[0]?.path

    // validate on videofile and thumbnail
    if(!videoPath || !thumbnailPath){
        throw new ApiError(404, "required video file and thumbail pic")
    }

    // upload on cloudinary
    const videoFile = await uploadOnCloudinary(videoPath)
    const thumbnail = await uploadOnCloudinary(thumbnailPath) 
    
    console.log(videoFile)

    // create a db entry and push into db
    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        owner: req.user._id,
        duration: videoFile.duration
    })

    // if video is empty
    if(!video){
        throw new ApiError(500, "Something went wrong while uploading video")
    }

    // return success response
    return res
    .status(200)
    .json( new ApiResponse(200, {video}, "Video Created Successfully"))

})

const getVideoById = asyncHandler(async (req, res) => {
    try {
        // fetch the video id from request parameter
        const { videoId } = req.params
        
        // validate the video id
        if(!isValidObjectId(videoId)){
            throw new ApiError(400, "Invalid Video Id")
        }
    
        // fetch the document using video id
        const video = await Video.findById(
            {_id: videoId}
        ).select("-thumbnail -isPublished -duration")
        
        // also fetch the user info
        const user = await User.findById(
            {_id: video?.owner}
        ).select("username avatar")

        // now create a json of video Info
        const videoInfo = {
            video,
            user 
        }

        // return success response
        return res
        .status(200)
        .json( new ApiResponse(200, {videoInfo}, "video by id fetched successfully"))
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching video")
    }
})  

const updateVideo = asyncHandler(async (req, res) => {
    // fetch the video id from request parameters
    const { videoId } = req.params
    
    // validate the video id
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }

    // fetch the video detail like title, description, thumbnail
    const {title, description} = req.body
    const thumbnailPath = req.file?.path;

    // if thumbnail is there then upload on cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailPath)

    // if either title or description or thumbnail is there then update otherwise return
    if(title || description || thumbnail){

        // find the document using video id
        const video = await Video.findOne(
            {_id: videoId, owner: req.user._id}
        )

        if(video){
            // if document was found then update it
            video.thumbnail = thumbnail?.url || video.thumbnail
            video.title = title || video.title
            video.description = description || video.description

            // after saving return response
            await video.save()

            // return success response
            return res
            .status(200)
            .json(new ApiResponse(200, {video}, "Video Updated Successfully"))

        } else{
            // if video is empty then throw an error
            throw new ApiError(400, "Unauthorized Request")
        }
    } else{
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "nothing to be update"))
    }
})

const deleteVideo = asyncHandler(async (req, res) => {
    // fetch the video id from request parameters
    const { videoId } = req.params
    
    // validate the video id
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }

    // if currently logged user is the owner of video then delete
    const deleteVideo = await Video.findOneAndDelete({_id: videoId, owner:req.user._id})

    // if logged user is not owner then throw an error
    if(!deleteVideo){
        throw new ApiError(400, "Unauthorized Request")
    }

    // return success response
    return res
    .status(200)
    .json( new ApiResponse(200, {}, "Video Deleted Successfully"))    
})

const togglePublishStatus = asyncHandler(async (req, res) => {

    // fetch the video id from request parameters
    const { videoId } = req.params
    
    // validate the video id
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }

    // fetch the document
    const video = await Video.findOne(
            {_id: videoId, owner:req.user._id},
        )

    // if document found then toogle it otherwise throw an error
    if(video){
        video.isPublished = !video.isPublished
        await video.save()
    } else {
        throw new ApiError(400, "Unauthorized Request")
    }

    // return success response
    return res
    .status(200)
    .json( new ApiResponse(200, {video}, "Toggle Publish Status Successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
}
