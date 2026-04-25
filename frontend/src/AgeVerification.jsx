import { useRef, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import { useNavigate, useParams } from "react-router-dom";

export default function AgeVerification() {
  const webcamRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  const capture = async () => {
    setLoading(true);

    const imageSrc = webcamRef.current.getScreenshot();

    try {
      const res = await axios.post("http://127.0.0.1:8000/verify-age", {
        image: imageSrc
      });

      const predictedAge = res.data.age;

      await updateDoc(
        doc(db, "parents", auth.currentUser.uid, "children", id),
        { verified_age: predictedAge }
      );

      navigate(`/child/${id}`);

    } catch (err) {
      alert("Error verifying age");
      console.error(err);
    }

    setLoading(false);
  };

  const manualSelect = async (bucket) => {
    await updateDoc(
      doc(db, "parents", auth.currentUser.uid, "children", id),
      { verified_age: bucket }
    );

    navigate(`/child/${id}`);
  };

  return (
    <div style={{ textAlign: "center", padding: 40 }}>
      <h2>Scan Face</h2>

      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        audio={false}
        videoConstraints={{ facingMode: "user" }}
      />

      <br /><br />

      <button onClick={capture}>
        {loading ? "Verifying..." : "Scan Age"}
      </button>

      <hr />

      <h3>Manual Select</h3>

      <button onClick={() => manualSelect("1-3")}>1–3</button>
      <button onClick={() => manualSelect("4-5")}>4–5</button>
      <button onClick={() => manualSelect("6-12")}>6–12</button>
    </div>
  );
}