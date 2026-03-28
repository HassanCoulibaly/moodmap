import { useEffect, useState } from 'react'

export default function RelativeTime({ timestamp }) {
  const [secondsAgo, setSecondsAgo] = useState(() => Math.floor((Date.now() - timestamp) / 1000))

  useEffect(() => {
    setSecondsAgo(Math.floor((Date.now() - timestamp) / 1000))
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - timestamp) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [timestamp])

  return (
    <span>
      {secondsAgo <= 0 ? 'just now' : `${secondsAgo}s ago`}
    </span>
  )
}
