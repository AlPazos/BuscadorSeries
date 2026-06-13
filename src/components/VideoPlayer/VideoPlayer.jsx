import { useEffect, useRef, useState } from 'react'
import './VideoPlayer.css'

// Componente de reproducción de video con controles personalizados.
// Recibe una URL de video y opcionalmente un título para el video.
function VideoPlayer({ src, title }) {
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateCurrentTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('timeupdate', updateCurrentTime)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('timeupdate', updateCurrentTime)
      video.removeEventListener('loadedmetadata', updateDuration)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  const handleSeek = (e) => {
    const video = videoRef.current
    if (!video) return

    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration
    video.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      video.muted = false
      setIsMuted(false)
      setVolume(1)
    } else {
      video.muted = true
      setIsMuted(true)
      setVolume(0)
    }
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }

  // Ocultar controles después de 3 segundos de inactividad
  useEffect(() => {
    let timeoutId
    if (showControls) {
      timeoutId = setTimeout(() => setShowControls(false), 3000)
    }
    return () => clearTimeout(timeoutId)
  }, [showControls])

  const handleMouseMove = () => {
    setShowControls(true)
  }

  if (!src) return null

  return (
    <div className="video-player" onMouseMove={handleMouseMove} onMouseLeave={() => setShowControls(false)}>
      <video
        ref={videoRef}
        src={src}
        className="video-player-video"
        onClick={togglePlay}
      />
      
      {/* Overlay de controles */}
      <div className={`video-player-controls ${showControls ? 'visible' : 'hidden'}`}>
        <button className="video-player-play-button" onClick={togglePlay}>
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <div className="video-player-progress" onClick={handleSeek}>
          <div 
            className="video-player-progress-bar" 
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
        
        <span className="video-player-time">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        
        <button className="video-player-mute-button" onClick={toggleMute}>
          {isMuted || volume === 0 ? '🔇' : '🔊'}
        </button>
      </div>
      
      {/* Título del video */}
      {title && <h3 className="video-player-title">{title}</h3>}
    </div>
  )
}

export default VideoPlayer