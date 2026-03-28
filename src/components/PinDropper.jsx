import { useMapEvents } from 'react-leaflet'

export default function PinDropper({ onDrop, skipRef }) {
  useMapEvents({
    click(e) {
      if (skipRef.current) { skipRef.current = false; return }
      onDrop(e.latlng)
    }
  })
  return null
}
