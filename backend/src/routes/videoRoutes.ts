import { Router } from "express";
import {
  createVideoHandler,
  listVideosHandler,
  getVideoHandler,
  updateVideoHandler,
  deleteVideoHandler,
  searchVideosHandler,
  registerViewHandler,
  trendingVideosHandler,
  relatedVideosHandler,
  searchSuggestionsHandler,
  saveSearchHandler,
  listSavedSearchesHandler,
  getSavedSearchHandler,
  listCategoriesHandler,
  popularTagsHandler
} from "../controllers/videoController";
import {
  createVideoSchema,
  listVideosSchema,
  searchVideosSchema,
  updateVideoSchema,
  videoIdParamSchema,
  createSavedSearchSchema
} from "../validators/videoValidators";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();

router.post("/videos", validateRequest(createVideoSchema), createVideoHandler);
router.get("/videos", validateRequest(listVideosSchema), listVideosHandler);
router.get("/videos/trending", trendingVideosHandler);
router.get("/videos/search", validateRequest(searchVideosSchema), searchVideosHandler);
router.get("/videos/search/suggestions", searchSuggestionsHandler);
router.post("/videos/search/save", validateRequest(createSavedSearchSchema), saveSearchHandler);
router.get("/videos/search/saved", listSavedSearchesHandler);
router.get("/videos/search/saved/:id", getSavedSearchHandler);
router.get("/videos/categories", listCategoriesHandler);
router.get("/videos/tags/popular", popularTagsHandler);
router.get("/videos/:id", validateRequest(videoIdParamSchema), getVideoHandler);
router.put("/videos/:id", validateRequest(updateVideoSchema), updateVideoHandler);
router.delete("/videos/:id", validateRequest(videoIdParamSchema), deleteVideoHandler);
router.post("/videos/:id/view", validateRequest(videoIdParamSchema), registerViewHandler);
router.get("/videos/:id/related", validateRequest(videoIdParamSchema), relatedVideosHandler);

export default router;
