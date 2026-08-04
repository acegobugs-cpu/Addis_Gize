export interface MediaFile {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimetype: string;
  uploaded_at: string;
}

export interface Media {
  mediaType: "image" | "video" | "audio" | "embed";
  url: string;
  alt?: string;
}