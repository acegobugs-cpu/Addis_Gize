import { getPresignedUrl } from "@/app/lib/api";

export async function putMedia(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const contentType = file.type || "application/octet-stream";

  // Step 1: Pass only metadata to get the presigned URL
  const { uploadUrl, mediaId, storageKey } = await getPresignedUrl({
    filename: file.name,
    contentType,
  });

  // Step 2: Upload the file binary directly to S3
  const arrayBuffer = await file.arrayBuffer();

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "Content-Length": file.size.toString(),
    },
    body: arrayBuffer,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`S3 upload failed (${uploadRes.status}): ${errText}`);
  }

  return {
    success: true,
    mediaId,
    storageKey,
  };
}