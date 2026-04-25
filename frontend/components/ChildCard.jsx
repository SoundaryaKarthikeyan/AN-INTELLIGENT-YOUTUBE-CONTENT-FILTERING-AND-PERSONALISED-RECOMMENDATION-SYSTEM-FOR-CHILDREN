export default function ChildCard({ child, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: "1px solid #ccc",
        padding: 20,
        margin: 10,
        cursor: "pointer",
        borderRadius: 10
      }}
    >
      <img
        src={child.avatar}
        width={80}
        height={80}
        style={{ borderRadius: "50%" }}
      />
      <h3>{child.name}</h3>
      <p>Age: {child.age}</p>
    </div>
  );
}