import { Video, ResizeMode } from "expo-av";
import { useRef } from "react";
import axios from "axios";

export default function VideoPlayer({ video, childId }: any) {
  const videoRef = useRef<any>(null);

  const handlePlayback = async (status: any) => {
    if (!status.isLoaded) return;

    // ✅ Save only when video ends (BEST)
    if (status.didJustFinish) {
      try {
        await axios.post("http://192.168.137.1:5000/track/watch", {
          child_id: childId,
          video_id: video.id,
          title: video.title,
          duration_watched: status.durationMillis / 1000,
          total_duration: status.durationMillis / 1000
        });

        console.log("Watch saved");
      } catch (err) {
        console.log("Tracking error:", err);
      }
    }
  };

  return (
    <Video
      ref={videoRef}
      source={{ uri: video.url }}
      useNativeControls
      resizeMode={ResizeMode.CONTAIN}
      onPlaybackStatusUpdate={handlePlayback}
      style={{ width: "100%", height: 200 }}
    />
  );
}