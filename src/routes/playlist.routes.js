import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createPlaylist,
    getUserPlaylist,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlayList
} from "../controllers/playlist.controller.js"

const router = Router()

// applying verify JWT middleware to all the playlist routes
router.use(verifyJWT)

router.route("/").post(createPlaylist)

router
    .route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlayList)
    .delete(deletePlaylist)

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist)
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist)

router.route("/user/:userId").get(getUserPlaylist)

export default router