import { View, Text, FlatList, Image, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import YoutubePlayer from "react-native-youtube-iframe";

export default function ActivityScreen() {
  const { history } = useLocalSearchParams();
  const data = history ? JSON.parse(history as string) : [];

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <FlatList
        data={data}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ padding: 15 }}
        renderItem={({ item }) => (
          <View style={styles.videoCard}>
            {/* Player scaled down */}
            <YoutubePlayer
              height={200}
              play={false}
              videoId={item.video_id}
            />
            <View style={styles.textContainer}>
              <Text style={styles.videoTitle}>{item.title?.replace(/&amp;/g, '&')}</Text>
              <Text style={styles.videoMeta}>
                Watched: {item.duration_watched}s | Total: {item.total_duration}s
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  videoCard: { 
    marginBottom: 25, 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  textContainer: { padding: 12 },
  videoTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  videoMeta: { fontSize: 12, color: '#888', marginTop: 4 }
});