import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

export default function WatchHistory({ data }: { data: any[] }) {
  // Calculate total time from the 'duration_watched' field in your Firestore
  const totalSeconds = data.reduce((acc, curr) => acc + (Number(curr.duration_watched) || 0), 0);
  const timeDisplay = `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`;

  return (
    <View style={{ flex: 1 }}>
      {/* 📊 THE ONLY TEXT ALLOWED: TOTAL TIME */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Total Activity: {timeDisplay}</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item, index) => (item.video_id || '') + index}
        renderItem={({ item }) => (
          <View style={styles.playerCard}>
            {/* 🎥 THE IFRAME (Using the video_id from your DB) */}
            <YoutubePlayer
              height={220}
              play={false}
              videoId={item.video_id}
              webViewProps={{
                androidLayerType: 'hardware',
                domStorageEnabled: true,
                javaScriptEnabled: true,
              }}
            />
            <View style={styles.footer}>
              <Text style={styles.footerText}>ID: {item.video_id} | Watched: {item.duration_watched}s</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20, backgroundColor: '#6C63FF', alignItems: 'center' },
  headerText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  playerCard: {
    margin: 15,
    backgroundColor: '#000',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    minHeight: 250, // Ensures the box doesn't collapse
  },
  footer: { padding: 8, backgroundColor: '#f8f9fa' },
  footerText: { fontSize: 10, color: '#999', textAlign: 'right' }
});