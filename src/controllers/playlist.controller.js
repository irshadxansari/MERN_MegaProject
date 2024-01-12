import {isValidObjectId} from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async(req,res) => {
    // fetch the name and description from request body
    const {name,description} = req.body

    // validate the name and description
    if(!name || !description){
        throw new ApiError("404", "All Fields are required")
    }

    // create the playlist and push into db
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    }) 
 
    // if Error occured due to server then throw an error
    if(!playlist){
        throw new ApiError(500, "Something went wrong while creating playlist please try again")
    }

    // return success response
    return res
    .status(200)
    .json(new ApiResponse(200, {playlist}, "PlayList Created Successfully"))
})

const getUserPlaylist = asyncHandler(async(req,res) => {
    
    // fetch the user id from request parameters
    const {userId} = req.params

    // validate the user id
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid Playlist Id")
    }

    // check if the currently logged user is requesting only his/her playlist  
    if( String(userId) !== String(req.user._id)){
        throw new ApiError(400, "Unauthorized Request")
    }

    // fetch the user playlist using userid
    const userPlaylist = await Playlist.find({owner:userId})
    
    // if playlist can't be retrived
    if(!userPlaylist){
        throw new ApiError(500, "Something went wrong while fetching user playlist")
    }

    // return success response
    return res
    .status(200)
    .json( new ApiResponse(200, {userPlaylist}, "User Playlist Fetched Successfully"))

})

const getPlaylistById = asyncHandler(async(req,res) => {

    // fetch the playlist id from request parameters
    const {playlistId} = req.params

    // validate the playlist id
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist Id")
    }

    // check if the currently logged user is not the owner of playlist
    const playlistById = await Playlist.findOne({_id:playlistId})

    // verify the owner
    if( String(playlistById.owner) !== String(req.user._id)){
        throw new ApiError(400, "Unauthorized Request")
    }
    
    // if playlist can't be retrived
    if(!playlistById){
        throw new ApiError(500, "Something went wrong while fetching playlist by id")
    }

    // return success response
    return res
    .status(200)
    .json( new ApiResponse(200, {playlistById}, "Playlist by Id Fetched Successfully"))

})

const addVideoToPlaylist = asyncHandler(async(req,res) => {
    // fetch the videoId and playlistId from request parameters
    const {videoId, playlistId} = req.params

    // if videoId or playlistId is invalid then throw an error
    if(!(isValidObjectId(videoId)) || !(isValidObjectId(playlistId))){
        throw new ApiError(404,"Invalid Credentials,")
    }

    // check if the currently logged user is not the owner of playlist
    let playlist = await Playlist.findOne({_id:playlistId})

    // verify the owner
    if( String(playlist.owner) !== String(req.user._id)){
        throw new ApiError(400, "Unauthorized Request")
    }

    // now push the video Id in playlist
    playlist = await Playlist.findByIdAndUpdate(
        {_id:playlistId},
        {video: {$push:{videoId}}},
        {new: true}
    ).populate(true)

    // return success response
    return res
    .status(200)
    .jsonn( new ApiResponse(200, {playlist}, "Video Added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async(req,res) => {

    // fetch the videoId and playlistId from request parameters
    const {videoId, playlistId} = req.params

    // if videoId or playlistId is invalid then throw an error
    if(!(isValidObjectId(videoId)) || !(isValidObjectId(playlistId))){
        throw new ApiError(404,"Invalid Credentials,")
    }

    // check if the playlist owner is logged user
    let playlist = await Playlist.findOne({_id:playlistId})

    // verify the owner
    if( String(playlist.owner) !== String(req.user._id)){
        throw new ApiError(400, "Unauthorized Request")
    }

    // now pop(remove) the video Id from playlist
    playlist = await Playlist.findByIdAndUpdate(
        {_id:playlistId},
        {video: {$pull :{videoId}}},
        {new: true}
    ).populate(true)

    // return success response
    return res
    .status(200)
    .jsonn( new ApiResponse(200, {playlist}, "Video Removed from playlist successfully"))
})

const deletePlaylist = asyncHandler(async(req,res) => {
    
    // fetch the playlist id from request parameter
    const {playlistId} = req.params

    // validate the playlist id
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Id")
    }

    // check if the currently logged user is not the owner of playlist
    const playlist = await Playlist.findOne({_id:playlistId})

    // verify the owner
    if( String(playlist.owner) !== String(req.user._id)){
        throw new ApiError(400, "Unauthorized Request")
    }

    // now delete the playlist from database
    await Playlist.findByIdAndDelete({_id:playlistId})

    // return success response
    return res
    .status(200)
    .json( new ApiResponse(200, {}, "Playlist is deleted Successfully"))

})

const updatePlayList = asyncHandler(async(req,res) => {
    // fetch the playlistId from request params
    const {playlistId} = req.params

    // fetch the name and description from request body
    const {name, description} = req.body

    // validate the playlistId , name and description
    if(!(isValidObjectId(playlistId)) || !name || !description){
        throw new ApiError(400, "Invalid Crediential")
    }

    // check if the currently logged user is not the owner of playlist
    let playlist = await Playlist.findOne({_id:playlistId})

    // verify the owner
    if( String(playlist.owner) !== String(req.user._id)){
        throw new ApiError(400, "Unauthorized Request")
    }

    // update the playlist
    playlist.name = name
    playlist.description = description

    // now save into db
    await playlist.save()

    // return success response
    return res
    .status(200)
    .json( new ApiResponse(200, {playlist}, "Playlist Updated Successfully"))
})

export {
    createPlaylist,
    getUserPlaylist,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlayList
}
