import { View, Text, TextInput, Button } from "react-native";
import { useState } from "react";

export default function TimeControl() {
  const [time, setTime] = useState("");

  return (
    <View>
      <Text>Set Time Limit</Text>

      <TextInput
        placeholder="Minutes"
        value={time}
        onChangeText={setTime}
        style={{ borderWidth: 1 }}
      />

      <Button title="Save" onPress={() => console.log(time)} />
    </View>
  );
}