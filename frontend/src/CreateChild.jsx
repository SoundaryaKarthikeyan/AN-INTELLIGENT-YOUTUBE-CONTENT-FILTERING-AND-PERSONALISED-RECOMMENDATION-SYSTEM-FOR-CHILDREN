import { useState } from "react";
import { auth, db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function CreateChild() {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const create = async () => {
    if (!name) {
      alert("Enter child name");
      return;
    }

    const docRef = await addDoc(
      collection(db, "parents", auth.currentUser.uid, "children"),
      {
        name,
        verified_age: null,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`,
        created_at: new Date()
      }
    );

    // Go directly to camera scan
    navigate(`/verify/${docRef.id}`);
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Create Child</h2>

      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <br /><br />

      <button onClick={create}>Create & Scan Age</button>
    </div>
  );
}