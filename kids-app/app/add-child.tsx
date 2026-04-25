import { View, Text, Button, Image, TouchableOpacity } from 'react-native';
import { useState, useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
 import * as FileSystem from 'expo-file-system';

export default function AddChild() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);
  const cameraRef = useRef<any>(null);
  const router = useRouter();

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
      quality: 1,
      skipProcessing: false,
    });

    setPhoto(pic);
  };

  const handleDetect = async () => {
    if (!photo) {
      alert("Take a photo first");
      return;
    }

    const formData = new FormData();

    formData.append('file', {
      uri: photo.uri,
      name: 'photo.jpg',
      type: 'image/jpg',
    });
try {
  const base64 = await FileSystem.readAsStringAsync(photo.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const res = await fetch('http://192.168.137.1:5000/predict', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: base64,
    }),
  });
  console.log("STATUS:", res.status);
  const data = await res.json();
  console.log("DATA:", data);

  if (data && data.age_group) {
    detected_age_group = data.age_group;
  }

} catch (err) {
  console.log("FETCH ERROR:", err);
}
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

          {/* ✅ CENTER BUTTON */}
          <View style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: [
              { translateX: -40 },
              { translateY: -40 }
            ]
          }}>
            <TouchableOpacity onPress={takePhoto}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'white',
                borderWidth: 4,
                borderColor: '#aaa',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <View style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: '#fff'
                }} />
              </View>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
          <Image source={{ uri: photo.uri }} style={{ width:200, height:200 }} />
          <Button title="Detect Age" onPress={handleDetect} />
        </View>
      )}
    </View>
  );
}