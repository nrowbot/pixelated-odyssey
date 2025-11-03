import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams, Link } from "react-router-dom";
import { getRelatedVideos, getVideoById, incrementViewCount } from "../services/videoApi";
import { Video } from "../types/video";
import { formatDuration, formatRelativeDate } from "../utils/format";

function toYouTubeEmbed(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch (error) {
    console.warn("Failed to parse YouTube URL", error);
  }
  return null;
}

const videoMimeTypes = [".mp4", ".webm", ".ogg", ".mov", ".mkv"];

export function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [related, setRelated] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const media = useMemo<ReactNode>(() => {
    if (!video) {
      return null;
    }

    const youtubeEmbed = toYouTubeEmbed(video.url);

    if (youtubeEmbed) {
      return (
        <iframe
          src={youtubeEmbed}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    const lowerUrl = video.url.toLowerCase();
    const supportsNative = videoMimeTypes.some((ext) => lowerUrl.endsWith(ext));

    if (supportsNative) {
      return <video src={video.url} poster={video.thumbnailUrl ?? undefined} controls preload="metadata" />;
    }

    return (
      <div className="video-detail__external">
        <p>Unable to play this video directly. You can open it in a new tab:</p>
        <a href={video.url} target="_blank" rel="noopener noreferrer">
          Watch "{video.title}"
        </a>
      </div>
    );
  }, [video]);

  useEffect(() => {
    if (!id) return;

    const numericId = Number(id);
    setIsLoading(true);

    Promise.all([getVideoById(numericId), getRelatedVideos(numericId)])
      .then(([fetchedVideo, relatedVideos]) => {
        setVideo(fetchedVideo);
        setRelated(relatedVideos);
        setError(null);
        const sessionId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${numericId}-${Date.now()}`;
        void incrementViewCount(numericId, sessionId);
      })
      .catch(() => {
        setError("Video not found");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <div className="video-detail">Loading…</div>;
  }

  if (error || !video) {
    return (
      <div className="video-detail">
        <p>{error ?? "Video not found"}</p>
        <Link to="/" className="link-button">
          Back to library
        </Link>
      </div>
    );
  }

  return (
    <div className="video-detail">
      <header>
        <Link to="/" className="link-button">
          ← Back to library
        </Link>
        <h1>{video.title}</h1>
        <div className="video-detail__meta">
          <span>{video.viewCount.toLocaleString()} views</span>
          <span>·</span>
          <span>{formatRelativeDate(video.uploadDate)}</span>
          <span>·</span>
          <span>{formatDuration(video.duration)}</span>
          <span>·</span>
          <span>{video.resolution}</span>
        </div>
      </header>
      <div className="video-detail__player">
        {media}
      </div>
      <section className="video-detail__description">
        <h2>Description</h2>
        <p>{video.description}</p>
        <div className="video-detail__tags">
          {video.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      </section>
      {related.length > 0 && (
        <section className="video-detail__related">
          <h2>Related videos</h2>
          <div className="video-detail__related-grid">
            {related.map((item) => (
              <Link key={item.id} to={`/videos/${item.id}`} className="related-card">
                {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={item.title} loading="lazy" /> : <div className="related-card__placeholder">No thumbnail</div>}
                <div className="related-card__body">
                  <strong>{item.title}</strong>
                  <span>{formatRelativeDate(item.uploadDate)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
