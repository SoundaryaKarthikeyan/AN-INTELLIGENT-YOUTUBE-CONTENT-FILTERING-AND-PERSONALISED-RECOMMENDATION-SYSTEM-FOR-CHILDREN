import React, { useEffect, useState, useMemo } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Alert 
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getWatchHistory, getCognitive } from "../services/api";
import { db } from "../firebase/config"; 
import { doc, setDoc, onSnapshot } from "firebase/firestore";

export default function Dashboard() {
  const { childId } = useLocalSearchParams();
  const router = useRouter();

  const [history, setHistory] = useState<any[]>([]);
  const [cognitive, setCognitive] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!childId) return;

    // 1. Real-time Listener for Remote Lock Status
    const unsub = onSnapshot(doc(db, "children", childId as string), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        // Check if explicitly locked or if a timer is still active
        const now = new Date();
        const lockUntil = data.lockUntil ? new Date(data.lockUntil) : null;
        setIsLocked(data.isLocked || (lockUntil && now < lockUntil));
      }
      setLoading(false);
    });

    // 2. Fetch Analytics Data
    getWatchHistory(childId as string).then(setHistory).catch(console.log);
    getCognitive(childId as string).then(d => setCognitive(d.band)).catch(console.log);

    return () => unsub();
  }, [childId]);

  
  const categoryDistribution = useMemo(() => {
    if (history.length === 0) return [];
    
    const totals: Record<string, number> = {};
    let grandTotalDuration = 0;

    history.forEach(item => {
      const topic = item.topic || "General";
      const duration = Number(item.duration_watched) || 0;
      totals[topic] = (totals[topic] || 0) + duration;
      grandTotalDuration += duration;
    });

    return Object.keys(totals).map(topic => ({
      topic,
      percentage: Math.round((totals[topic] / grandTotalDuration) * 100),
      // Assigning specific colors for the UI bars
      color: topic.toLowerCase().includes('math') ? '#6C63FF' : 
             topic.toLowerCase().includes('rhyme') ? '#FF6B6B' : '#4ECDC4'
    })).sort((a, b) => b.percentage - a.percentage);
  }, [history]);

  // --- 🔒 SAFETY CONTROL: Lock/Timer Logic ---
  const handleLockAction = async (mode: 'toggle' | 'timer') => {
    const childRef = doc(db, "children", childId as string);
    try {
      if (mode === 'toggle') {
        // Toggle the current state and clear any existing timer
        await setDoc(childRef, { 
          isLocked: !isLocked, 
          lockUntil: null 
        }, { merge: true });
      } else {
        // Set a 1-hour block from now
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 1);
        await setDoc(childRef, { 
          isLocked: true, 
          lockUntil: expiry.toISOString() 
        }, { merge: true });
        Alert.alert("Timer Set", "Access restricted for 60 minutes.");
      }
    } catch (err) {
      console.error("Lock Error:", err);
      Alert.alert("Error", "Could not sync with database.");
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{flex: 1}} color="#6C63FF" />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Parent Dashboard</Text>

      {/* 📊 CATEGORY DISTRIBUTION CARD */}
      <View style={styles.card}>
        <Text style={styles.label}>Child's Focus Area</Text>
        {categoryDistribution.length > 0 ? (
          <View style={{ marginTop: 15 }}>
            {categoryDistribution.map((item, index) => (
              <View key={index} style={styles.distRow}>
                <View style={styles.distHeader}>
                  <Text style={styles.distLabel}>{item.topic}</Text>
                  <Text style={styles.distValue}>{item.percentage}%</Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={[styles.barFill, { width: `${item.percentage}%`, backgroundColor: item.color }]} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No watch history available for analysis.</Text>
        )}
      </View>

      {/* 🔐 REMOTE ACCESS CONTROL */}
      <View style={styles.card}>
        <Text style={styles.label}>Safety & Timer</Text>
        <View style={styles.row}>
          <TouchableOpacity 
            style={[styles.actionBtn, isLocked ? styles.btnRed : styles.btnGreen]} 
            onPress={() => handleLockAction('toggle')}
          >
            <Text style={styles.btnText}>{isLocked ? "Unlock App" : "Lock App"}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.btnTimer]} 
            onPress={() => handleLockAction('timer')}
          >
            <Text style={styles.btnText}>Lock 1 Hour</Text>
          </TouchableOpacity>
        </View>
        {isLocked && <Text style={styles.statusInfo}>⚠️ Child app is currently restricted.</Text>}
      </View>

      {/* COGNITIVE ANALYSIS */}
      <View style={styles.card}>
        <Text style={styles.label}>Cognitive Status</Text>
        <Text style={styles.valueText}>{cognitive || "Collecting Data..."}</Text>
      </View>

      {/* NAVIGATION TO DETAILED LOGS */}
      <TouchableOpacity 
        style={styles.mainAction}
        onPress={() => router.push({
          pathname: "/activity",
          params: { childId, history: JSON.stringify(history) }
        })}
      >
        <Text style={styles.mainActionText}>View Full Watch Activity ({history.length})</Text>
        <Text style={styles.mainActionSub}>Detailed timestamp and session logs</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 25, color: '#2D3436' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 18, marginBottom: 18, elevation: 3 },
  label: { fontSize: 12, color: '#B2BEC3', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  valueText: { fontSize: 20, color: '#6C63FF', marginTop: 10, fontWeight: 'bold' },
  // Distribution Chart Styles
  distRow: { marginBottom: 18 },
  distHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  distLabel: { fontSize: 15, fontWeight: '600', color: '#636E72' },
  distValue: { fontSize: 15, fontWeight: 'bold', color: '#2D3436' },
  barContainer: { height: 10, backgroundColor: '#DFE6E9', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  // Control Styles
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  actionBtn: { flex: 0.48, padding: 14, borderRadius: 12, alignItems: 'center' },
  btnGreen: { backgroundColor: '#00B894' },
  btnRed: { backgroundColor: '#D63031' },
  btnTimer: { backgroundColor: '#6C63FF' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  statusInfo: { color: '#D63031', fontSize: 13, marginTop: 12, textAlign: 'center', fontWeight: '500' },
  // Main Action
  mainAction: { backgroundColor: '#6C63FF', padding: 22, borderRadius: 18, alignItems: 'center' },
  mainActionText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  mainActionSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
  emptyText: { marginTop: 15, color: '#B2BEC3', fontStyle: 'italic' }
});