import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createVideo } from "../services/videoApi";
import { CreateVideoInput } from "../types/video";
import { useSearchStore } from "../store/searchStore";

interface FormState {
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  duration: string;
  category: string;
  tags: string;
  uploadDate: string;
  uploaderName: string;
  fileSizeMb: string;
  resolution: string;
}

const initialFormState: FormState = {
  title: "",
  description: "",
  url: "",
  thumbnailUrl: "",
  duration: "",
  category: "",
  tags: "",
  uploadDate: "",
  uploaderName: "",
  fileSizeMb: "",
  resolution: ""
};

const resolutionOptions = ["4K", "1440p", "1080p", "720p", "480p", "360p"];

export function VideoUploadPage() {
  const navigate = useNavigate();
  const { categories, loadCategories } = useSearchStore((state) => ({
    categories: state.categories,
    loadCategories: state.loadCategories
  }));
  const [form, setForm] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categories.length) {
      void loadCategories();
    }
  }, [categories.length, loadCategories]);

  const handleChange = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const resetForm = () => {
    setForm(initialFormState);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const durationSeconds = Number(form.duration);
    const fileSizeMb = Number(form.fileSizeMb);

    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      setError("Duration must be a positive number of seconds.");
      return;
    }

    if (!Number.isFinite(fileSizeMb) || fileSizeMb <= 0) {
      setError("File size must be greater than zero (in MB).");
      return;
    }

    const payload: CreateVideoInput = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      url: form.url.trim(),
      thumbnailUrl: form.thumbnailUrl.trim() || undefined,
      duration: Math.round(durationSeconds),
      category: form.category.trim(),
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      uploadDate: form.uploadDate || undefined,
      uploaderName: form.uploaderName.trim(),
      fileSize: Math.round(fileSizeMb * 1024 * 1024),
      resolution: form.resolution.trim()
    };

    if (!payload.title || !payload.url || !payload.category || !payload.uploaderName || !payload.resolution) {
      setError("Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createVideo(payload);
      resetForm();
      navigate(`/videos/${created.id}`);
    } catch (submitError) {
      console.error("Failed to upload video", submitError);
      setError("Failed to upload video. Please verify the details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="upload-page">
      <header className="upload-page__header">
        <Link to="/" className="link-button">
          ← Back to library
        </Link>
        <h1>Add a new video</h1>
        <p>Share a new discovery with the community. Provide accurate metadata to keep search fast and relevant.</p>
      </header>
      <main className="upload-page__content">
        <form className="upload-form" onSubmit={handleSubmit}>
          <div className="upload-form__grid">
            <label>
              <span>Title *</span>
              <input type="text" value={form.title} onChange={handleChange("title")} required maxLength={200} />
            </label>

            <label>
              <span>Uploader *</span>
              <input type="text" value={form.uploaderName} onChange={handleChange("uploaderName")} required maxLength={100} />
            </label>

            <label className="upload-form__full">
              <span>Description</span>
              <textarea value={form.description} onChange={handleChange("description")} rows={4} maxLength={1000} />
            </label>

            <label>
              <span>Video URL *</span>
              <input type="url" value={form.url} onChange={handleChange("url")} required />
            </label>

            <label>
              <span>Thumbnail URL</span>
              <input type="url" value={form.thumbnailUrl} onChange={handleChange("thumbnailUrl")} />
            </label>

            <label>
              <span>Duration (seconds) *</span>
              <input type="number" min={1} value={form.duration} onChange={handleChange("duration")} required />
            </label>

            <label>
              <span>File size (MB) *</span>
              <input type="number" min={1} value={form.fileSizeMb} onChange={handleChange("fileSizeMb")} required />
            </label>

            <label>
              <span>Category *</span>
              <input
                type="text"
                value={form.category}
                onChange={handleChange("category")}
                required
                list="category-options"
                placeholder="Pick an existing category or add a new one"
              />
              {categories.length > 0 && (
                <datalist id="category-options">
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              )}
            </label>

            <label>
              <span>Resolution *</span>
              <input
                type="text"
                value={form.resolution}
                onChange={handleChange("resolution")}
                required
                list="resolution-options"
                placeholder="e.g. 1080p"
              />
              <datalist id="resolution-options">
                {resolutionOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </label>

            <label>
              <span>Upload date</span>
              <input type="date" value={form.uploadDate} onChange={handleChange("uploadDate")} />
            </label>

            <label className="upload-form__full">
              <span>Tags (comma separated)</span>
              <input type="text" placeholder="e.g. react, typescript, tutorial" value={form.tags} onChange={handleChange("tags")} />
            </label>
          </div>

          {error && <div className="upload-form__error">{error}</div>}

          <div className="upload-form__actions">
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? "Uploading…" : "Upload video"}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                resetForm();
                setError(null);
              }}
              disabled={isSubmitting}
            >
              Reset form
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
