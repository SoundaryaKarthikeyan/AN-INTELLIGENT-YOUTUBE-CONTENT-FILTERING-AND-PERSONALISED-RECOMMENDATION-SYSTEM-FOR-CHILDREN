import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export default function ParentAnalytics({ childId }) {
  const [data, setData] = useState({});

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const q = query(
      collection(db, "watch_history"),
      where("child_id", "==", childId)
    );

    const snap = await getDocs(q);

    const counts = {};
    snap.docs.forEach(doc => {
      const v = doc.data().video_id;
      counts[v] = (counts[v] || 0) + 1;
    });

    setData(counts);
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Watch Analytics</h2>
      {Object.entries(data).map(([video, count]) => (
        <p key={video}>
          {video} watched {count} times
        </p>
      ))}
    </div>
  );
}