import { useEffect, useRef, useState } from 'react'

export default function BottomSheet({ isOpen, onClose, title, children }) {
  const sheetRef = useRef(null)
  const contentRef = useRef(null)
  const dragStartY = useRef(null)
  const dragStartScrollTop = useRef(0)
  const [translateY, setTranslateY] = useState(0)
  const isDragging = useRef(false)

  // body 스크롤 잠금 (iOS 대응: position fixed 사용)
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
    } else {
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      if (scrollY) window.scrollTo(0, -parseInt(scrollY || '0'))
      setTranslateY(0)
    }
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
    }
  }, [isOpen])

  // 드래그 투 클로즈
  const onTouchStart = (e) => {
    const content = contentRef.current
    // 콘텐츠 영역 스크롤이 상단에 있을 때만 드래그 허용
    if (content && content.scrollTop > 0) return
    dragStartY.current = e.touches[0].clientY
    dragStartScrollTop.current = content ? content.scrollTop : 0
    isDragging.current = true
  }

  const onTouchMove = (e) => {
    if (!isDragging.current || dragStartY.current === null) return
    const content = contentRef.current
    const dy = e.touches[0].clientY - dragStartY.current

    // 아래로 드래그 + 콘텐츠 스크롤이 상단일 때만 시트 이동
    if (dy > 0 && (!content || content.scrollTop === 0)) {
      e.preventDefault()
      setTranslateY(dy)
    }
  }

  const onTouchEnd = () => {
    if (!isDragging.current) return
    isDragging.current = false
    const dy = translateY
    if (dy > 100) {
      onClose()
    } else {
      setTranslateY(0)
    }
    dragStartY.current = null
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end items-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      {/* 시트 본문 */}
      <div
        ref={sheetRef}
        className="relative w-full max-w-[480px] bg-white rounded-t-2xl flex flex-col"
        style={{
          maxHeight: '80vh',
          transform: `translateY(${translateY}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.2s ease',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0 cursor-grab">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            <button onClick={onClose} className="p-1 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div
          ref={contentRef}
          className="overflow-y-auto flex-1 p-4"
          style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}