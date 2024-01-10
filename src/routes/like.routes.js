import { Router } from "express";
import {verifyJWT} from '../middlewares/auth.middleware.js'
import {
    toogleVideoLike,
    toogleCommentLike,
    toogleTweetLike,
    getLikedVideo
} from '../controllers/like.controller.js'

const router = Router()

// Applying verifyJWT in all the like route
router.use(verifyJWT)

router.route('/toogle/v/:videoId').post(toogleVideoLike)
router.route('/toogle/c/:commentId').post(toogleCommentLike)
router.route('/toogle/t/:tweetId').post(toogleTweetLike)
router.route('/videos').get(getLikedVideo)

export default router