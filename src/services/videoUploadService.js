import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import "../firebase"; // or correct path to your firebase.js

const VIDEO_INTRO_PATH = "video_intro";

/**
 * Upload a recorded intro video blob/file to Firebase Storage.
 *
 * @param {Object} params
 * @param {Blob|File} params.videoBlob
 * @param {string|number} params.userId
 * @param {string|null} [params.previousUrl]
 * @param {(progress: number) => void} [params.onProgress]
 * @returns {Promise<{downloadUrl: string, storagePath: string} | null>}
 */
export async function uploadIntroVideoRecording({
  videoBlob,
  userId,
  previousUrl = null,
  onProgress,
}) {
  if (!videoBlob) {
    console.error("uploadIntroVideoRecording: videoBlob is required");
    return null;
  }

  if (!userId) {
    console.error("uploadIntroVideoRecording: userId is required");
    return null;
  }

  try {
    const storage = getStorage();

    const fileSizeInBytes = videoBlob.size ?? 0;
    console.log(
      `Before uploading: size=${fileSizeInBytes} bytes, mb=${(
        fileSizeInBytes /
        (1024 * 1024)
      ).toFixed(2)}`
    );

    const extension = getVideoExtension(videoBlob);
    const fileName = `${userId}_${Date.now()}${extension}`;
    const storagePath = `${VIDEO_INTRO_PATH}/${fileName}`;

    const storageRef = ref(storage, storagePath);

    const metadata = {
      contentType: normalizeVideoContentType(videoBlob.type),
    };

    const uploadTask = uploadBytesResumable(storageRef, videoBlob, metadata);

    const downloadUrl = await new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const total = snapshot.totalBytes || 1;
          const progress = (snapshot.bytesTransferred / total) * 100;

          if (typeof onProgress === "function") {
            onProgress(progress);
          }
        },
        (error) => {
          console.error("Error uploading video:", error);
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (error) {
            reject(error);
          }
        }
      );
    });

    // Delete previous uploaded video after successful new upload
    if (previousUrl) {
      try {
        await deleteFileFromUrl(previousUrl);
      } catch (error) {
        console.warn("Previous video could not be deleted:", error);
      }
    }

    return {
      downloadUrl,
      storagePath,
    };
  } catch (error) {
    console.error("uploadIntroVideoRecording failed:", error);
    return null;
  }
}

/**
 * Delete a Firebase Storage file from its download URL.
 *
 * @param {string} fileUrl
 * @returns {Promise<boolean>}
 */
export async function deleteFileFromUrl(fileUrl) {
  if (!fileUrl) return false;

  try {
    const storage = getStorage();
    const filePath = extractFirebasePathFromUrl(fileUrl);

    if (!filePath) {
      throw new Error("Could not extract Firebase file path from URL");
    }

    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);

    console.log("File deleted successfully.");
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
}

/**
 * Optional helper if you want a single function that uploads
 * and returns only the URL.
 *
 * @param {Object} params
 * @returns {Promise<string | null>}
 */
export async function uploadIntroVideoUrl(params) {
  const result = await uploadIntroVideoRecording(params);
  return result?.downloadUrl ?? null;
}

function getVideoExtension(videoBlob) {
  const type = (videoBlob?.type || "").toLowerCase();

  if (type.includes("webm")) return ".webm";
  if (type.includes("mp4")) return ".mp4";
  if (type.includes("ogg")) return ".ogg";
  if (type.includes("quicktime")) return ".mov";

  return ".webm";
}

function normalizeVideoContentType(contentType) {
  if (!contentType) return "video/webm";

  const lowered = contentType.toLowerCase();

  if (lowered.includes("webm")) return "video/webm";
  if (lowered.includes("mp4")) return "video/mp4";
  if (lowered.includes("ogg")) return "video/ogg";
  if (lowered.includes("quicktime")) return "video/quicktime";

  return contentType;
}

function extractFirebasePathFromUrl(fileUrl) {
  try {
    const decodedUrl = decodeURIComponent(fileUrl.split("?")[0]);
    const parts = decodedUrl.split("/o/");

    if (parts.length < 2) return null;

    return parts[1];
  } catch (error) {
    console.error("Failed to extract Firebase path from URL:", error);
    return null;
  }
}