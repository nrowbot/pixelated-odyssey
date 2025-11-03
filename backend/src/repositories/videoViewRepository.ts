import { startOfDay, subDays } from "date-fns";
import { prisma } from "../config/database";

export async function recordView(videoId: number, viewerIp?: string, sessionId?: string) {
  await prisma.videoView.create({
    data: {
      videoId,
      viewerIp,
      sessionId
    }
  });
}

export async function getTrendingVideos(limit: number) {
  const sevenDaysAgo = startOfDay(subDays(new Date(), 7));

  const trending = await prisma.videoView.groupBy({
    by: ["videoId"],
    where: {
      viewedAt: {
        gte: sevenDaysAgo
      }
    },
    _count: {
      videoId: true
    },
    orderBy: {
      _count: {
        videoId: "desc"
      }
    },
    take: limit
  });

  const videoIds = trending.map((item) => item.videoId);

  if (!videoIds.length) {
    return [];
  }

  const videos = await prisma.video.findMany({
    where: { id: { in: videoIds } },
    include: { tags: { include: { tag: true } } }
  });

  return videos.sort((a, b) => videoIds.indexOf(a.id) - videoIds.indexOf(b.id));
}
