import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {
    createTweet,
    getUserTweet,
    updateTweet,
    deleteTweet
} from '../controllers/tweet.controller.js'

const router = Router();

// Applying verifyJWT in all the tweet route
router.use(verifyJWT);

router.route('/').post(createTweet);
router.route('/user/:userId').get(getUserTweet);
router.route('/update/:tweetId').patch(updateTweet);
router.route('/delete/:tweetId').patch(deleteTweet);

export default router;