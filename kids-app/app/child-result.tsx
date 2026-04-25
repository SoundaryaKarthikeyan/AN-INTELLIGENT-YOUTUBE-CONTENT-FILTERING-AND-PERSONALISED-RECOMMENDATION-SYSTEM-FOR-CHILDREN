import { View, Text, TextInput, Button } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { auth, db } from '../firebase/config';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';

export default function ChildResult() {
  const { age_group } = useLocalSearchParams();
  const router = useRouter();

  const [name, setName] = useState('');

  const handleSave = async () => {
    const user = auth.currentUser;

    if (!user) {
      alert("Not logged in");
      return;
    }

    await addDoc(
      collection(db, "parents", user.uid, "children"),
      {
        name,
        age_group,
        created_at: new Date()
      }
    );

    alert("Child saved!");
    router.replace('/children');
  };

  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center', gap:10 }}>
      <Text>Detected Age Group: {age_group}</Text>

      <TextInput
        placeholder="Enter child name"
        value={name}
        onChangeText={setName}
        style={{ borderWidth:1, width:200, padding:8 }}
      />

      <Button title="Save Child" onPress={handleSave} />
    </View>
  );
}