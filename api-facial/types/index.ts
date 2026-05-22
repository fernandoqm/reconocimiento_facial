export interface SearchRequest {
  api_key: string;
  event_photos: string[];
  selfie?: string;        // base64 JPEG/PNG — first-time users
  face_vector?: number[]; // 128-float descriptor — returning users
  threshold?: number;     // euclidean distance threshold, default 0.6
}

export interface SearchResponse {
  matches: string[];
  confidence_scores: number[];
  selfie_vector?: number[]; // returned when selfie was provided, so WordPress can persist it
}

export interface IndexPhotoRequest {
  api_key: string;
  photo_url: string;
  event_id?: string;
}

export interface IndexPhotoResponse {
  faces_found: number;
  vectors: number[][];
}

export interface MatchResult {
  photoUrl: string;
  confidence: number; // 0–1, higher is better
  distance: number;   // euclidean distance, lower is better
}
