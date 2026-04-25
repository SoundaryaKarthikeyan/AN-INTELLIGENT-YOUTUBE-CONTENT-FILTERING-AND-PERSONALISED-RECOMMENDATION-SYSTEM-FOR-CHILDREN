import { db } from '../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';

export const fetchVideosByAge = async (age_group: string) => {
  const q = query(
    collection(db, "videos"),
    where("age_group", "==", age_group)
  );

  const snapshot = await getDocs(q);

  const videos: any[] = [];

  snapshot.forEach((doc) => {
    videos.push({ id: doc.id, ...doc.data() });
  });

  return videos;
};