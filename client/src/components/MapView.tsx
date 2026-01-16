export default function MapView({ mapUrl }: { mapUrl?: string | null }) {
  if (!mapUrl) {
    return <p>No map configured for this chronicle.</p>;
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h2>City Map</h2>
      <iframe
        src={mapUrl}
        width="100%"
        height="500"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}