import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
} from "../controllers/comment.controller.js"

const router = Router()

// applying verifyJWT middlewares to all comment routes 
router.use(verifyJWT)

router.route("/:videoId").get(getVideoComments)
router.route("/:videoId").post(addComment)

router.route("/c/:commentId").patch(updateComment)
router.route("/c/:commentId").delete(deleteComment)

export default router