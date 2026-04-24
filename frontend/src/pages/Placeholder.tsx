export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="header">
      <div>
        <h1>{title}</h1>
        <p style={{ marginTop: '16px', color: 'var(--color-burgundy)', opacity: 0.7 }}>
          This page is under construction.
        </p>
      </div>
    </div>
  );
}
