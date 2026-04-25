export default function VideoCard({ video }) {
  return (
    <div style={{
      border: "1px solid #ddd",
      padding: 20,
      marginBottom: 20,
      borderRadius: 10
    }}>
      <h4>{video.title}</h4>

      <iframe
        width="360"
        height="215"
        src={`https://www.youtube.com/embed/${video.id}`}
        allowFullScreen
      />

      <p>Topic: {video.topic}</p>
      <p>Risk: {video.risk_score}</p>
    </div>
  );
}