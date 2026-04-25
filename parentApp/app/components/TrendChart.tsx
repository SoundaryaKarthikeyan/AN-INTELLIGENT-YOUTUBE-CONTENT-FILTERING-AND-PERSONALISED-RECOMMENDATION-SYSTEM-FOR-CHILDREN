import { View, Text, Dimensions } from "react-native";
import { BarChart } from "react-native-chart-kit";

export default function TrendChart({ data }: any) {
  if (!data.labels) return null;

  return (
    <View>
      <Text>Trends</Text>

      <BarChart
        data={{
          labels: data.labels,
          datasets: [{ data: data.values }]
        }}
        width={Dimensions.get("window").width - 20}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        fromZero
        chartConfig={{
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#fff",
          color: () => "#000"
        }}
      />
    </View>
  );
}