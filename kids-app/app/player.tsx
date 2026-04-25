import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useLocalSearchParams } from 'expo-router';
import { db } from '../firebase/config';
import { collection, getDocs, query, where, limit, doc, getDoc } from 'firebase/firestore';
import { getSafeRecommendations, Video } from '../utils/recommender';

export default function Player() {
  const params = useLocalSearchParams();
  const [currentVideoId, setCurrentVideoId] = useState(params.videoId as string);
  const [currentTitle, setCurrentTitle] = useState(params.title as string);
  
  const childId = params.childId as string;
  const age_group = (params.age_group as string) || "6-12";

  const [playing, setPlaying] = useState(true);
  const [recommendedVideos, setRecommendedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const hasTracked = useRef<Record<string, boolean>>({});
  const activeVideoRef = useRef({ id: currentVideoId, title: currentTitle });

  useEffect(() => {
    activeVideoRef.current = { id: currentVideoId, title: currentTitle };
    loadContent();
  }, [currentVideoId]);

  const loadContent = async () => {
    setLoading(true);
    try {
      // 1. Fetch All Videos (Dimension Table)
      const vSnap = await getDocs(collection(db, "videos"));
      const allVideos = vSnap.docs.map(d => ({ docId: d.id, ...d.data() } as Video));

      // 2. Fetch Watch History (Fact Table)
      const hSnap = await getDocs(query(collection(db, "watch_history"), where("child_id", "==", childId), limit(25)));
      
      // 🛠️ THE ENRICHMENT JOIN:
      // We take the minimal history and attach the 'topic' from the videos list
      const historyData = hSnap.docs.map(hDoc => {
        const hData = hDoc.data();
        const originalVideo = allVideos.find(v => v.docId === hData.video_id);
        return {
          ...hData,
          topic: originalVideo?.topic || "general" // Now history HAS a topic!
        };
      });

      console.log(`\n--- 🧠 ML ENGINE TRACE ---`);
      console.log(`Total History Records Enriched: ${historyData.length}`);

      // 3. Run Recommender with Enriched Data
      const ranked = getSafeRecommendations(allVideos, historyData, age_group);
      const filtered = ranked.filter(v => v.docId !== currentVideoId).slice(0, 10);
      
      setRecommendedVideos(filtered);
    } catch (error) {
      console.error("Join Error:", error);
    }
    setLoading(false);
  };

  const handleStateChange = async (state: string) => {
    const { id, title } = activeVideoRef.current;
    if (state === "playing" && !hasTracked.current[id]) {
      hasTracked.current[id] = true;
      
      try {
        await fetch("http://192.168.137.1:5000/track/watch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            child_id: childId,
            video_id: id,
            title: title,
            duration_watched: 100, 
            total_duration: 100,
            timestamp: new Date().toISOString()
          })
        });
        console.log("📡 Tracking synced. Refreshing engine...");
        setTimeout(() => loadContent(), 1500); // Wait for DB consistency
      } catch (err) { console.log("Track fail"); }
    }
  };

  return (
    <View style={styles.container}>
      <YoutubePlayer height={230} play={playing} videoId={currentVideoId} onChangeState={handleStateChange} />
      <View style={styles.header}><Text style={styles.mainTitle}>{currentTitle}</Text></View>
      <Text style={styles.sidebarTitle}>Personalized for You ✨</Text>
      {loading ? <ActivityIndicator size="large" color="#6C63FF" style={{marginTop: 30}} /> : (
        <FlatList
          data={recommendedVideos}
          keyExtractor={(item, index) => item.docId + index}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => { setCurrentVideoId(item.docId); setCurrentTitle(item.title); setPlaying(true); }} style={styles.card}>
              <Image source={{ uri: `https://img.youtube.com/vi/${item.docId}/0.jpg` }} style={styles.thumb} />
              <View style={styles.details}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.scoreBadge}><Text style={styles.scoreText}>Match: {item.recommendationScore}</Text></View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 10 },
  header: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  mainTitle: { fontSize: 18, fontWeight: 'bold' },
  sidebarTitle: { marginTop: 20, fontSize: 16, fontWeight: 'bold', color: '#6C63FF' },
  card: { flexDirection: 'row', marginTop: 15, alignItems: 'center' },
  thumb: { width: 110, height: 65, borderRadius: 8 },
  details: { marginLeft: 12, flex: 1 },
  cardTitle: { fontWeight: '600', fontSize: 14 },
  scoreBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4, alignSelf: 'flex-start' },
  scoreText: { color: '#2E7D32', fontSize: 11, fontWeight: 'bold' }
});