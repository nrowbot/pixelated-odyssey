import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { VideoSearchResult } from "../../types/video";
import { formatDuration, formatRelativeDate, truncate } from "../../utils/format";

interface VideoCardProps {
  result: VideoSearchResult;
}

const previewableExtensions = [".mp4", ".webm", ".ogg", ".mov", ".mkv"];

function renderHighlight(highlights?: string[], fallback?: string | null) {
  if (highlights && highlights.length > 0) {
    return <span dangerouslySetInnerHTML={{ __html: highlights.join(" … ") }} />;
  }
  if (!fallback) {
    return null;
  }
  return <span>{truncate(fallback, 100)}</span>;
}

export function VideoCard({ result }: VideoCardProps) {
  const { video, highlights } = result;
  const [isPreviewing, setIsPreviewing] = useState(false);
  const timeoutRef = useRef<number>();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const canPreview = useMemo(() => {
    const url = video.url.toLowerCase();
    return previewableExtensions.some((ext) => url.endsWith(ext));
  }, [video.url]);

  useEffect(() => {
    const element = videoRef.current;
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      if (element) {
        element.pause();
      }
    };
  }, []);

  const stopPreview = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    setIsPreviewing(false);
    const element = videoRef.current;
    if (element) {
      element.pause();
      element.currentTime = 0;
    }
  };

  const startPreview = () => {
    if (!canPreview) {
      return;
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setIsPreviewing(true);
      const element = videoRef.current;
      if (element) {
        const playPromise = element.play();
        if (playPromise) {
          void playPromise.catch(() => {
            // Ignore preview autoplay issues
          });
        }
      }
    }, 150);
  };

  return (
    <article className="video-card">
      <Link
        to={`/videos/${video.id}`}
        className={`video-card__media ${isPreviewing ? "video-card__media--previewing" : ""}`}
        onMouseEnter={startPreview}
        onMouseLeave={stopPreview}
        onFocus={startPreview}
        onBlur={stopPreview}
      >
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} loading="lazy" />
        ) : (
          <div className="video-card__placeholder">No thumbnail</div>
        )}
        {canPreview && (
          <video
            ref={videoRef}
            className={`video-card__preview ${isPreviewing ? "is-visible" : ""}`}
            src={video.url}
            muted
            loop
            playsInline
            preload="metadata"
            poster={video.thumbnailUrl ?? undefined}
          />
        )}
        <span className="video-card__duration">{formatDuration(video.duration)}</span>
        <span className="video-card__resolution">{video.resolution}</span>
      </Link>
      <div className="video-card__body">
        <Link to={`/videos/${video.id}`} className="video-card__title">
          {renderHighlight(highlights.title, video.title)}
        </Link>
        <p className="video-card__description">{renderHighlight(highlights.description, video.description)}</p>
        <div className="video-card__meta">
          <span>{video.viewCount.toLocaleString()} views</span>
          <span>· {formatRelativeDate(video.uploadDate)}</span>
        </div>
        <div className="video-card__tags">
          {video.tags.map((tag) => (
            <span key={tag} className="video-card__tag">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
