import { View, Text, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function SelectChild() {
  const { children } = useLocalSearchParams();
  const router = useRouter();

  // ✅ SAFE PARSE (THIS FIXES YOUR ERROR)
  let parsed: any[] = [];

  try {
    parsed = children ? JSON.parse(children as string) : [];
  } catch (e) {
    console.log("Parse error:", e);
    parsed = [];
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>
        Select Child
      </Text>

      {parsed.length === 0 ? (
        <Text>No children found</Text>
      ) : (
        parsed.map((child: any) => (
          <TouchableOpacity
            key={child.id}
            onPress={() =>
              router.push({
                pathname: "/dashboard",
                params: { childId: child.id } // ✅ only pass ID
              })
            }
            style={{
              padding: 10,
              marginVertical: 5,
              backgroundColor: "#eee"
            }}
          >
            <Text>{child.name}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}