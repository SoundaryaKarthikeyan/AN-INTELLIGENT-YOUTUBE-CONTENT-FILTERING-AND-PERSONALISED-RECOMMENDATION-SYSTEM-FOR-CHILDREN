import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import ChildCard from "../components/ChildCard";

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const snapshot = await getDocs(
        collection(db, "parents", auth.currentUser.uid, "children")
      );

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setChildren(data);
    };

    load();
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h2>Your Children</h2>

      {children.map(child => (
        <ChildCard
          key={child.id}
          child={child}
          onClick={() =>
            navigate(`/verify/${child.id}`, {
              state: { age: child.age }
            })
          }
        />
      ))}

      <button onClick={() => navigate("/create-child")}>
        + Add Child
      </button>
    </div>
  );
}