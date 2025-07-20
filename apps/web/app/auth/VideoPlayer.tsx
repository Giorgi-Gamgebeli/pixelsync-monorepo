"use client";

import React, { useRef, useState, useEffect } from "react";
import ReactPlayer from "react-player";

type VideoPlayerProps = {
  videoURL: string;
  id: string;
};

function VideoPlayer({ videoURL, id }: VideoPlayerProps) {
  const playerRef = useRef<ReactPlayer | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="pointer-events-none relative aspect-video min-w-full">
      {isClient && (
        <ReactPlayer
          ref={playerRef}
          url={videoURL}
          playing
          muted
          loop
          id={id}
          controls={false}
          width="100%"
          height="100%"
        />
      )}
    </div>
  );
}

export default VideoPlayer;
