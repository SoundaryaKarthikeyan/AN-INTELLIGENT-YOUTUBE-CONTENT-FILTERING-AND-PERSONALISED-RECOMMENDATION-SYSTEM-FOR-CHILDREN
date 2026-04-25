import { TouchableOpacity, Text } from 'react-native';

export default function ChildCard({ child, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        padding: 20,
        margin: 10,
        backgroundColor: '#eee',
        borderRadius: 10
      }}
    >
      <Text>{child.name}</Text>
      <Text>{child.age_group}</Text>
    </TouchableOpacity>
  );
}