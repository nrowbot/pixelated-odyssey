import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { deleteVideo, getRelatedVideos, getVideoById, incrementViewCount } from "../services/videoApi";
import { Video } from "../types/video";
import { formatDuration, formatRelativeDate } from "../utils/format";
import { useSearchStore } from "../store/searchStore";

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
  const navigate = useNavigate();
  const { removeVideoFromResults, search, fetchTrending, page: currentPage, pageSize } = useSearchStore((state) => ({
    removeVideoFromResults: state.removeVideoFromResults,
    search: state.search,
    fetchTrending: state.fetchTrending,
    page: state.page,
    pageSize: state.pageSize
  }));
  const [video, setVideo] = useState<Video | null>(null);
  const [related, setRelated] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const media = useMemo<{ element: ReactNode; isExternal: boolean } | null>(() => {
    if (!video) {
      return null;
    }

    const youtubeEmbed = toYouTubeEmbed(video.url);

    if (youtubeEmbed) {
      return {
        element: (
          <iframe
            src={youtubeEmbed}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ),
        isExternal: false
      };
    }

    const lowerUrl = video.url.toLowerCase();
    const supportsNative = videoMimeTypes.some((ext) => lowerUrl.endsWith(ext));

    if (supportsNative) {
      return {
        element: <video src={video.url} poster={video.thumbnailUrl ?? undefined} controls preload="metadata" />,
        isExternal: false
      };
    }

    return {
      element: (
        <div className="video-detail__external">
          <p>Unable to play this video directly. You can open it in a new tab:</p>
          <a href={video.url} target="_blank" rel="noopener noreferrer">
            Watch "{video.title}"
          </a>
        </div>
      ),
      isExternal: true
    };
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
        setDeleteError(null);
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

  const handleDelete = async () => {
    if (!video) {
      return;
    }

    const confirmed = window.confirm(`Delete "${video.title}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteVideo(video.id);
      removeVideoFromResults(video.id);
      await Promise.all([
        fetchTrending(),
        search({ page: currentPage, pageSize })
      ]);
      navigate("/", { replace: true });
    } catch (deleteErr) {
      console.error("Failed to delete video", deleteErr);
      setDeleteError("Failed to delete video. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="video-detail">
      <header>
        <div className="video-detail__topbar">
          <Link to="/" className="link-button">
            ← Back to library
          </Link>
          <div className="video-detail__actions">
            {deleteError && <span className="video-detail__delete-error">{deleteError}</span>}
            <button type="button" className="danger-button" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting…" : "Delete video"}
            </button>
          </div>
        </div>
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
      <div className={`video-detail__player ${media?.isExternal ? "video-detail__player--external" : ""}`}>
        {media?.element}
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
