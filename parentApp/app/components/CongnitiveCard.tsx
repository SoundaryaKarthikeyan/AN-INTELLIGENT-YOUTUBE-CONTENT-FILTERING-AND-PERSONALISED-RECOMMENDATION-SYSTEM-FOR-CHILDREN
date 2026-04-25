import { View, Text } from "react-native";

export default function CognitiveCard({ data }: any) {
  return (
    <View>
      <Text>Cognitive Band</Text>
      <Text>{data}</Text>
    </View>
  );
}