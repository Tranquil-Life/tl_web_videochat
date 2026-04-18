import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import "../firebase";

const VIDEO_INTRO_PATH = "video_intro";
const PROFILE_PIC_PATH = "profile_image";

/**
 * Generic upload helper
 */
async function uploadMediaFile({
  file,
  userId,
  folderPath,
  previousUrl = null,
  onProgress,
  contentTypeResolver,
  extensionResolver,
  defaultContentType,
  defaultExtension,
  logLabel = "file",
}) {
  if (!file) {
    console.error(`uploadMediaFile: ${logLabel} file is required`);
    return null;
  }

  if (!userId) {
    console.error("uploadMediaFile: userId is required");
    return null;
  }

  try {
    const storage = getStorage();

    const fileSizeInBytes = file.size ?? 0;
    console.log(
      `Before uploading ${logLabel}: size=${fileSizeInBytes} bytes, mb=${(
        fileSizeInBytes /
        (1024 * 1024)
      ).toFixed(2)}`
    );

    const extension =
      extensionResolver?.(file) || defaultExtension || getGenericExtension(file);
    const fileName = `${userId}_${Date.now()}${extension}`;
    const storagePath = `${folderPath}/${fileName}`;

    const storageRef = ref(storage, storagePath);

    const metadata = {
      contentType:
        contentTypeResolver?.(file.type) || defaultContentType || file.type,
    };

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

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
          console.error(`Error uploading ${logLabel}:`, error);
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

    if (previousUrl) {
      try {
        await deleteFileFromUrl(previousUrl);
      } catch (error) {
        console.warn(`Previous ${logLabel} could not be deleted:`, error);
      }
    }

    return {
      downloadUrl,
      storagePath,
    };
  } catch (error) {
    console.error(`uploadMediaFile failed for ${logLabel}:`, error);
    return null;
  }
}

/**
 * VIDEO
 */
export async function uploadIntroVideoRecording({
  videoBlob,
  userId,
  previousUrl = null,
  onProgress,
}) {
  return uploadMediaFile({
    file: videoBlob,
    userId,
    folderPath: VIDEO_INTRO_PATH,
    previousUrl,
    onProgress,
    contentTypeResolver: normalizeVideoContentType,
    extensionResolver: getVideoExtension,
    defaultContentType: "video/webm",
    defaultExtension: ".webm",
    logLabel: "video",
  });
}

export async function uploadIntroVideoUrl(params) {
  const result = await uploadIntroVideoRecording(params);
  return result?.downloadUrl ?? null;
}

/**
 * IMAGE
 */
export async function uploadProfileImage({
  imageFile,
  userId,
  previousUrl = null,
  onProgress,
}) {
  return uploadMediaFile({
    file: imageFile,
    userId,
    folderPath: PROFILE_PIC_PATH,
    previousUrl,
    onProgress,
    contentTypeResolver: normalizeImageContentType,
    extensionResolver: getImageExtension,
    defaultContentType: "image/jpeg",
    defaultExtension: ".jpg",
    logLabel: "image",
  });
}

export async function uploadProfileImageUrl(params) {
  const result = await uploadProfileImage(params);
  return result?.downloadUrl ?? null;
}

/**
 * DELETE FROM URL
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

function getImageExtension(imageFile) {
  const type = (imageFile?.type || "").toLowerCase();

  if (type.includes("png")) return ".png";
  if (type.includes("webp")) return ".webp";
  if (type.includes("gif")) return ".gif";
  if (type.includes("jpeg") || type.includes("jpg")) return ".jpg";

  return ".jpg";
}

function normalizeImageContentType(contentType) {
  if (!contentType) return "image/jpeg";

  const lowered = contentType.toLowerCase();

  if (lowered.includes("png")) return "image/png";
  if (lowered.includes("webp")) return "image/webp";
  if (lowered.includes("gif")) return "image/gif";
  if (lowered.includes("jpeg") || lowered.includes("jpg")) return "image/jpeg";

  return contentType;
}

function getGenericExtension(file) {
  const type = (file?.type || "").toLowerCase();
  if (type.includes("png")) return ".png";
  if (type.includes("jpeg") || type.includes("jpg")) return ".jpg";
  if (type.includes("webp")) return ".webp";
  if (type.includes("mp4")) return ".mp4";
  if (type.includes("webm")) return ".webm";
  return "";
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