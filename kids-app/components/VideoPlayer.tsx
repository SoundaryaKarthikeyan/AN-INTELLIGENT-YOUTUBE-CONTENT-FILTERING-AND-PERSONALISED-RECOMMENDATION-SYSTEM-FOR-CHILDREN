import { Video, ResizeMode } from "expo-av";
import { useRef } from "react";
import axios from "axios";

export default function VideoPlayer({ video, childId }: any) {
  const videoRef = useRef<any>(null);

  const handlePlayback = async (status: any) => {
    if (!status.isLoaded) return;

    console.log("🎬 STATUS:", status.positionMillis);

    // 🔥 SAVE WHEN VIDEO ENDS
    if (status.didJustFinish) {
      console.log("🔥 SENDING DATA");

      try {
        await axios.post("http://192.168.137.1:5000/track/watch", {
          child_id: childId,
          video_id: video?.id || "test",
          title: video?.title || "Test Video",
          thumbnail:video?.thumbnail || "Photo",
          duration_watched: status.durationMillis / 1000,
          total_duration: status.durationMillis / 1000
        });

        console.log("✅ SENT TO BACKEND");

      } catch (err) {
        console.log("❌ AXIOS ERROR:", err);
      }
    }
  };

  return (
    <Video
      ref={videoRef}
      source={{ uri: video?.url || "https://www.w3schools.com/html/mov_bbb.mp4" }}
      useNativeControls
      resizeMode={ResizeMode.CONTAIN}
      onPlaybackStatusUpdate={handlePlayback}
      style={{ width: "100%", height: 200 }}
    />
  );
}