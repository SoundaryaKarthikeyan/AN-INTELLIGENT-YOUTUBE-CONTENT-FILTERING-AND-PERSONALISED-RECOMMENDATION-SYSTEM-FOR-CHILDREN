import { useState } from "react";
import { View, TextInput, Button, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { loginParent } from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    try {
      setLoading(true);
      console.log("LOGIN CLICKED");

      const data = await loginParent(email);

      console.log("RESPONSE:", data);

      if (!data || !data.children) {
        alert("No children found");
        return;
      }

      router.push({
        pathname: "/select-child",
        params: {
          children: JSON.stringify(data.children) // ✅ safe pass
        }
      });

    } catch (err) {
      console.log("ERROR:", err);
      alert("Login failed (check backend)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Parent Login</Text>

      <TextInput
        placeholder="Enter Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, marginVertical: 10, padding: 8 }}
      />

      {loading ? (
        <ActivityIndicator />
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}
    </View>
  );
}