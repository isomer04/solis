import { useActionState } from "react";
import { z } from "zod";
import { Link, Navigate } from "react-router-dom";
import { usePosts } from "../context/PostsContext";
import { getErrorMessage } from "../lib/getErrorMessage";

const CLOUDINARY_UPLOAD_PRESET = import.meta.env
  .VITE_APP_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_APP_CLOUDINARY_CLOUD_NAME;

const CloudinaryResponseSchema = z.object({ secure_url: z.string() });

function getFormString(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

function getFormFile(fd: FormData, key: string): File | null {
  const v = fd.get(key);
  return v instanceof File ? v : null;
}

interface FormErrors {
  title?: string;
  content?: string;
  imageUrl?: string;
}

async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData },
  );
  if (!res.ok) throw new Error("Image upload failed");
  const data: unknown = await res.json();
  const parsed = CloudinaryResponseSchema.safeParse(data);
  if (!parsed.success) throw new Error("Unexpected Cloudinary response shape");
  return parsed.data.secure_url;
}

function validate(
  title: string,
  content: string,
  imageUrl: string,
): FormErrors {
  const errors: FormErrors = {};
  if (!title.trim()) errors.title = "Title is required.";
  else if (title.trim().length > 200)
    errors.title = "Title must be under 200 characters.";

  if (!content.trim()) errors.content = "Content is required.";
  else if (content.trim().length > 5000)
    errors.content = "Content must be under 5 000 characters.";

  if (imageUrl.trim() && !/^https?:\/\//i.test(imageUrl.trim()))
    errors.imageUrl = "Image URL must begin with http:// or https://";

  return errors;
}

type ActionState = {
  fieldErrors: FormErrors;
  submitError: string | null;
  success: boolean;
};

const initialState: ActionState = {
  fieldErrors: {},
  submitError: null,
  success: false,
};

export default function PostForm() {
  const { createPost } = usePosts();

  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      if (!CLOUDINARY_UPLOAD_PRESET || !CLOUDINARY_CLOUD_NAME) {
        return {
          fieldErrors: {},
          submitError: "Image uploads are not configured.",
          success: false,
        };
      }

      const title = getFormString(formData, "title");
      const content = getFormString(formData, "content");
      const imageUrl = getFormString(formData, "imageUrl");
      const imageFile = getFormFile(formData, "image");
      const tag = getFormString(formData, "tag") || "Discussion";

      const fieldErrors = validate(title, content, imageUrl);
      if (Object.keys(fieldErrors).length > 0) {
        return { fieldErrors, submitError: null, success: false };
      }

      try {
        let finalImageUrl = imageUrl.trim();
        if (imageFile && imageFile.size > 0) {
          if (!imageFile.type.startsWith("image/")) {
            return {
              fieldErrors: { imageUrl: "File must be an image." },
              submitError: null,
              success: false,
            };
          }
          if (imageFile.size > 5 * 1024 * 1024) {
            return {
              fieldErrors: { imageUrl: "Image must be smaller than 5 MB." },
              submitError: null,
              success: false,
            };
          }
          finalImageUrl = await uploadToCloudinary(imageFile);
        }
        await createPost({
          title: title.trim(),
          content: content.trim(),
          image_url: finalImageUrl || null,
          comments: [],
          tag,
        });
        return { fieldErrors: {}, submitError: null, success: true };
      } catch (err) {
        return {
          fieldErrors: {},
          submitError:
            getErrorMessage(err) ||
            "Failed to create post. Please try again.",
          success: false,
        };
      }
    },
    initialState,
  );

  if (state.success) {
    return <Navigate to="/community" replace />;
  }

  if (!CLOUDINARY_UPLOAD_PRESET || !CLOUDINARY_CLOUD_NAME) {
    return (
      <div className="flex justify-center px-4 pt-6">
        <div className="alert alert-error max-w-xl">
          <span>
            Image uploads are not configured. Please contact the site
            administrator.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center px-4 pt-6 pb-12">
      <title>Create Post — Solis</title>
      <div className="card w-full max-w-xl bg-base-100 shadow-xl">
        <div className="card-body gap-4">
          <h1 className="text-2xl font-bold text-center">Create Post</h1>

          {state.submitError && (
            <div className="alert alert-error text-sm py-2" role="alert">
              {state.submitError}
            </div>
          )}

          <form action={formAction} noValidate className="flex flex-col gap-4">
            {/* Title */}
            <div className="flex flex-col gap-1">
              <label
                className="fieldset-label font-semibold"
                htmlFor="pf-title"
              >
                Title
              </label>
              <input
                id="pf-title"
                name="title"
                type="text"
                className={`input w-full ${state.fieldErrors.title ? "input-error" : ""}`}
                maxLength={200}
                required
              />
              {state.fieldErrors.title && (
                <p className="text-error text-sm">{state.fieldErrors.title}</p>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1">
              <label
                className="fieldset-label font-semibold"
                htmlFor="pf-content"
              >
                Content
              </label>
              <textarea
                id="pf-content"
                name="content"
                className={`textarea w-full h-36 ${state.fieldErrors.content ? "textarea-error" : ""}`}
                maxLength={5000}
                required
              />
              {state.fieldErrors.content && (
                <p className="text-error text-sm">
                  {state.fieldErrors.content}
                </p>
              )}
            </div>

            {/* Tag */}
            <div className="flex flex-col gap-1">
              <label className="fieldset-label font-semibold" htmlFor="pf-tag">
                Category
              </label>
              <select
                id="pf-tag"
                name="tag"
                className="select select-bordered w-full"
                defaultValue="Discussion"
              >
                <option value="Discussion">Discussion</option>
                <option value="Analysis">Analysis</option>
                <option value="Tutorial">Tutorial</option>
                <option value="News">News</option>
              </select>
            </div>

            {/* Image upload */}
            <div className="flex flex-col gap-1">
              <label
                className="fieldset-label font-semibold"
                htmlFor="pf-image-file"
              >
                Upload Image (optional)
              </label>
              <input
                id="pf-image-file"
                name="image"
                type="file"
                accept="image/*"
                className="file-input w-full"
              />
            </div>

            {/* Image URL */}
            <div className="flex flex-col gap-1">
              <label
                className="fieldset-label font-semibold"
                htmlFor="pf-image-url"
              >
                Or paste an Image URL (optional)
              </label>
              <input
                id="pf-image-url"
                name="imageUrl"
                type="url"
                className={`input w-full ${state.fieldErrors.imageUrl ? "input-error" : ""}`}
                placeholder="https://…"
              />
              {state.fieldErrors.imageUrl && (
                <p className="text-error text-sm">
                  {state.fieldErrors.imageUrl}
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Saving…
                  </>
                ) : (
                  "Create Post"
                )}
              </button>
              <Link to="/community" className="btn btn-ghost flex-1">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
