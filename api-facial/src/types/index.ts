export interface SearchRequest {
  api_key: string;
  event_photos: string[];
  selfie?: string;        // base64 JPEG/PNG — usuarios nuevos
  face_vector?: number[]; // 128 floats — usuarios ya registrados
  threshold?: number;     // distancia euclidiana, default 0.6
}

export interface SearchResponse {
  matches: string[];
  confidence_scores: number[];
  selfie_vector?: number[]; // incluido cuando se procesó una selfie nueva
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
  confidence: number; // 0–1
  distance: number;   // distancia euclidiana
}
