import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../firebase/config';
import { collection, getDocs, query, where, limit, onSnapshot, doc } from 'firebase/firestore';
import { getSafeRecommendations, Video, WatchHistory } from '../utils/recommender';

export default function Home() {
  const { child, detected_age_group } = useLocalSearchParams();
  const router = useRouter();

  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [appLocked, setAppLocked] = useState(false);

  // Parse Child Data
  const parsedChild = child ? JSON.parse(child as string) : null;
  const childId = parsedChild?.id;
  const age_group = (detected_age_group as string)?.trim() || "6-12";

  useEffect(() => {
    if (!childId) return;

    // 🛡️ REAL-TIME GATEKEEPER
    const unsubLock = onSnapshot(doc(db, "children", childId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const now = new Date();
        const lockUntil = data.lockUntil ? new Date(data.lockUntil) : null;
        
        const isCurrentlyLocked = data.isLocked || (lockUntil && now < lockUntil);
        
        setAppLocked(isCurrentlyLocked);

        if (isCurrentlyLocked) {
          setVideos([]); 
        } else {
          // If unlocked, fetch the content again
          fetchPersonalizedContent();
        }
      }
    });

    return () => unsubLock();
  }, [childId]);

  const fetchPersonalizedContent = async () => {
    if (appLocked) return; // Don't fetch if locked
    setLoading(true);
    try {
      const hSnap = await getDocs(query(collection(db, "watch_history"), where("child_id", "==", childId), limit(30)));
      const historyData = hSnap.docs.map(doc => doc.data() as WatchHistory);

      const vSnap = await getDocs(query(collection(db, "videos"), where("age_group", "==", age_group)));
      const allVideos = vSnap.docs.map(doc => ({ docId: doc.id, ...doc.data() } as Video));

      const personalizedList = getSafeRecommendations(allVideos, historyData, age_group, "blocked");
      setVideos(personalizedList);
    } catch (err) {
      console.error("Home Fetch Error:", err);
    }
    setLoading(false);
  };

  // --- RENDER LOGIC ---

  return (
    <View style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
      {appLocked ? (
        /* 🔒 RESTRICTED VIEW */
        <View style={styles.lockedContainer}>
          <Text style={styles.lockedIcon}>🌙</Text>
          <Text style={styles.lockedTitle}>Time for a Break!</Text>
          <Text style={styles.lockedSub}>
            Your parents have set a timer. The app will be back soon!
          </Text>
          <View style={styles.timerBadge}>
             <Text style={styles.timerText}>Status: Restricted</Text>
          </View>
        </View>
      ) : (
        /* 📺 ACTIVE VIEW */
        <View style={{ flex: 1, padding: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333' }}>
            Hi, {parsedChild?.name ?? "Explorer"}!
          </Text>
          <Text style={{ color: '#666', marginBottom: 20 }}>Ready to learn?</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#6C63FF" />
          ) : (
            <FlatList
              data={videos}
              keyExtractor={(item) => item.docId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => router.push({
                    pathname: "/player",
                    params: { videoId: item.docId, childId, title: item.title, age_group }
                  })}
                  style={styles.videoCard}
                >
                  <Image
                    source={{ uri: `https://img.youtube.com/vi/${item.docId}/0.jpg` }}
                    style={{ width: '100%', height: 180 }}
                  />
                  <View style={{ padding: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.title}</Text>
                    <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>Topic: {item.topic}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  videoCard: { marginBottom: 20, backgroundColor: '#fff', borderRadius: 15, overflow: 'hidden', elevation: 3 },
  lockedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#fff' },
  lockedIcon: { fontSize: 80, marginBottom: 20 },
  lockedTitle: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
  lockedSub: { fontSize: 16, color: '#636e72', textAlign: 'center', marginTop: 10, lineHeight: 22 },
  timerBadge: { marginTop: 30, backgroundColor: '#dfe6e9', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  timerText: { color: '#2d3436', fontWeight: 'bold' }
});