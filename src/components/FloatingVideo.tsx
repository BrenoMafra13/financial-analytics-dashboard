interface FloatingVideoProps {
  videoId: string
}

export function FloatingVideo({ videoId }: FloatingVideoProps) {
  return (
    <div className="fixed right-3 top-3 z-50 flex w-[20.7rem] max-w-[90vw] flex-col overflow-hidden rounded-2xl border border-white/15 bg-black/80 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-white">
        <span>Watch the Project walkthrough:</span>
      </div>
      <div className="aspect-video w-full">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="Project walkthrough"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  )
}
