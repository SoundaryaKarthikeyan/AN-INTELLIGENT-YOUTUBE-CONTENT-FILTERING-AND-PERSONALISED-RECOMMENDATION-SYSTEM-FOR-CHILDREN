import {
  View,
  Text,
  Button,
  Image,
  TouchableOpacity
} from 'react-native';

import { useState, useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function Scan() {
  const { child } = useLocalSearchParams();
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const cameraRef = useRef<any>(null);

  if (!permission) return <Text>Loading...</Text>;

  if (!permission.granted) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <Text>Need camera permission</Text>
        <Button title="Grant" onPress={requestPermission} />
      </View>
    );
  }

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    const pic = await cameraRef.current.takePictureAsync({
      quality: 0.6,
    });

    setPhoto(pic);
  };
const handleDetect = async () => {
  if (!photo || !photo.uri) {
    alert("Take a photo first");
    return;
  }

  setLoading(true);

  let detected_age_group = "1-3";

  try {
    const formData = new FormData();

    formData.append('file', {
      uri: photo.uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as any);

    const res = await fetch('http://192.168.1.33:8000/predict/', {
      method: 'POST',
      body: formData,
    });

    console.log("STATUS:", res.status);

    const data = await res.json();
    console.log("DATA:", data);

    // 🔥 STRICT CHECK
    if (data && data.age_group) {
      detected_age_group = data.age_group;
      console.log("SET AGE:", detected_age_group);
    } else {
      console.log("NO AGE RETURNED");
    }

  } catch (err) {
    console.log("FETCH ERROR:", err);
  }

  console.log("FINAL AGE SENT:", detected_age_group);

  router.replace({
    pathname: '/home',
    params: { child, detected_age_group }
  });

  setLoading(false);
};
  // 🔥 SKIP
  const handleSkip = () => {
    router.replace({
      pathname: '/home',
      params: {
        child,
        detected_age_group: "6-12"
      }
    });
  };

  return (
    <View style={{ flex:1 }}>
      {!photo ? (
        <>
          <CameraView
            style={{ flex:1 }}
            ref={cameraRef}
            facing="front"
          />

          {/* Capture */}
          <View style={{
            position:'absolute',
            top:'50%',
            left:'50%',
            transform:[{translateX:-40},{translateY:-40}]
          }}>
            <TouchableOpacity onPress={takePhoto}>
              <View style={{
                width:80,
                height:80,
                borderRadius:40,
                backgroundColor:'white'
              }} />
            </TouchableOpacity>
          </View>

          {/* Skip */}
          <View style={{
            position:'absolute',
            bottom:50,
            width:'100%',
            alignItems:'center'
          }}>
            <Button title="Skip" onPress={handleSkip} />
          </View>
        </>
      ) : (
        <View style={{
          flex:1,
          alignItems:'center',
          justifyContent:'center'
        }}>
          <Image
            source={{ uri: photo.uri }}
            style={{ width:200, height:200 }}
          />

          {loading && <Text>Processing...</Text>}

          <Button title="Verify Age" onPress={handleDetect} />
          <Button title="Skip" onPress={handleSkip} />
          <Button title="Retake" onPress={() => setPhoto(null)} />
        </View>
      )}
    </View>
  );
}