export type ActiveTab = "features" | "quality" | "faq" | "pricing" | "feedback" | "history" | "profile" | "showcase";

export interface VideoOption {
  id: string;
  label: string;
  size: string;
}

export interface AudioOption {
  id: string;
  label: string;
  size: string;
}

export interface ExtractedMedia {
  title: string;
  channel: string;
  views: string;
  duration: string;
  thumbnailUrl: string;
  videoOptions: VideoOption[];
  audioOptions: AudioOption[];
  postContent?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "support" | "system";
  text: string;
  timestamp: string;
  metadata?: {
    engine?: string;
    processingTime?: string;
    status?: string;
    tokens?: number;
  };
}
