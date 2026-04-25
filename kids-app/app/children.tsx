import {
  View,
  Text,
  Button,
  FlatList,
  TouchableOpacity
} from 'react-native';

import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

import { auth, db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export default function Children() {
  const router = useRouter();
  const [children, setChildren] = useState<any[]>([]);

  const fetchChildren = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const snapshot = await getDocs(
      collection(db, "parents", user.uid, "children")
    );

    const list: any[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });

    setChildren(list);
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  return (
    <View style={{ flex:1, padding:20 }}>
      <Button
        title="Create Child"
        onPress={() => router.push('/add-child')}
      />

      <FlatList
        data={children}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/scan',
                params: { child: JSON.stringify(item) }
              })
            }
            style={{
              marginTop:20,
              padding:15,
              backgroundColor:'#eee',
              borderRadius:10
            }}
          >
            <Text style={{ fontWeight:'bold' }}>{item.name}</Text>
            <Text>Age Group: {item.age_group}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}