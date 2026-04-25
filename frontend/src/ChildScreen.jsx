import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function ChildScreen() {
  const { id } = useParams();
  const [child, setChild] = useState(null);
  const [videos, setVideos] = useState([]);
  const [recent, setRecent] = useState([]);
  const [search, setSearch] = useState("");
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) load(user.uid);
    });
    return () => unsub();
  }, []);

  const load = async (uid) => {
    const childRef = doc(db, "parents", uid, "children", id);
    const childSnap = await getDoc(childRef);

    if (!childSnap.exists()) return;

    const childData = childSnap.data();
    setChild(childData);

    // Fetch age-matching videos
    const q = query(
      collection(db, "videos"),
      where("age_group", "==", childData.verified_age)
    );

    const snapshot = await getDocs(q);
    const videoList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    setVideos(videoList);

    // Load watch history
    const historyQ = query(
      collection(db, "watch_history"),
      where("child_id", "==", id)
    );

    const historySnap = await getDocs(historyQ);
    const watchedIds = historySnap.docs.map(d => d.data().video_id);

    const recentVideos = videoList.filter(v => watchedIds.includes(v.id));
    setRecent(recentVideos);
  };

  const trackClick = async (video) => {
    await addDoc(collection(db, "watch_history"), {
      child_id: id,
      video_id: video.id,
      watched_at: new Date()
    });

    setPlaying(video.id);
  };

  const filtered = videos.filter(v =>
    v.title.toLowerCase().includes(search.toLowerCase())
  );

  if (!child) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <div style={{
      background: "#f4f3ff",
      minHeight: "100vh",
      padding: 30
    }}>
      {/* HEADER */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        marginBottom: 30
      }}>
        <img
          src={child.avatar}
          width="70"
          style={{ borderRadius: "50%", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
        />
        <div>
          <h2 style={{ margin: 0 }}>{child.name}</h2>
          <p style={{ margin: 0, color: "#666" }}>
            Safe for {child.verified_age}
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search videos..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 30,
          border: "none",
          marginBottom: 30,
          fontSize: 16,
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
        }}
      />

      {/* RECENTLY WATCHED */}
      {recent.length > 0 && (
        <>
          <h3>Recently Watched</h3>
          <div style={{ display: "flex", gap: 15, overflowX: "auto" }}>
            {recent.map(video => (
              <img
                key={video.id}
                src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                width="200"
                style={{ borderRadius: 12, cursor: "pointer" }}
                onClick={() => trackClick(video)}
              />
            ))}
          </div>
          <br />
        </>
      )}

      {/* VIDEO GRID */}
      <h3>Explore</h3>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 20
      }}>
        {filtered.map(video => (
          <div
            key={video.id}
            style={{
              background: "white",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
              cursor: "pointer",
              transition: "0.2s"
            }}
            onClick={() => trackClick(video)}
          >
            <img
              src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
              width="100%"
            />
            <div style={{ padding: 12 }}>
              <p style={{ fontSize: 14, margin: 0 }}>
                {video.title}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL PLAYER */}
      {playing && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
          onClick={() => setPlaying(null)}
        >
          <div style={{ width: "80%", maxWidth: 800 }}>
            <iframe
              width="100%"
              height="450"
              src={`https://www.youtube.com/embed/${playing}`}
              allowFullScreen
              style={{ borderRadius: 16 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}