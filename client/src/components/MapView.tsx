export default function MapView({ mapUrl }: { mapUrl?: string | null }) {
  if (!mapUrl) {
    return <p className="text-blood-muted">No map configured for this chronicle.</p>;
  }

  return (
    <div className="card">
      <h2 className="card-header">City Map</h2>
      <iframe
        src={mapUrl}
        width="100%"
        height="500"
        className="rounded-lg border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}