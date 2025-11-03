import { Link } from "react-router-dom";
import { VideoSearchResult } from "../../types/video";
import { formatDuration, formatRelativeDate, truncate } from "../../utils/format";

interface VideoCardProps {
  result: VideoSearchResult;
}

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

  return (
    <article className="video-card">
      <Link to={`/videos/${video.id}`} className="video-card__media">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} loading="lazy" />
        ) : (
          <div className="video-card__placeholder">No thumbnail</div>
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
