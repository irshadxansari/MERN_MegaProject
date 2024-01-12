import { Router } from "express";
import {
    toogleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router()

// applyig verifyJwt middleware in all the subscription route
router.use(verifyJWT)

router.route("/c/:channelId").post(toogleSubscription)
router.route("/c/:subscriberId").get(getSubscribedChannels)

router.route("/u/:channelId").get(getUserChannelSubscribers)

export default router