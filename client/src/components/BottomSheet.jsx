import { useEffect, useRef, useState } from 'react'

export default function BottomSheet({ isOpen, onClose, title, children }) {
  const contentRef = useRef(null)
  const dragStartY = useRef(null)
  const [translateY, setTranslateY] = useState(0)
  const dragging = useRef(false)

  // body 스크롤 잠금 (iOS 대응: position fixed 방식)
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
    } else {
      const top = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      if (top) window.scrollTo(0, -parseInt(top))
      setTranslateY(0)
    }
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
    }
  }, [isOpen])

  const startDrag = (clientY) => {
    // 콘텐츠가 스크롤 최상단일 때만 드래그 활성화
    if (contentRef.current && contentRef.current.scrollTop > 0) return
    dragStartY.current = clientY
    dragging.current = true
  }

  const moveDrag = (clientY) => {
    if (!dragging.current) return
    // 드래그 중 콘텐츠가 위로 올라갔으면 드래그 취소
    if (contentRef.current && contentRef.current.scrollTop > 0) {
      dragging.current = false
      setTranslateY(0)
      return
    }
    const dy = clientY - dragStartY.current
    if (dy > 0) setTranslateY(dy)
  }

  const endDrag = () => {
    if (!dragging.current) return
    dragging.current = false
    if (translateY > 100) {
      onClose()
    } else {
      setTranslateY(0)
    }
    dragStartY.current = null
  }

  // 터치
  const onSheetTouchStart = (e) => startDrag(e.touches[0].clientY)
  const onSheetTouchMove = (e) => {
    if (!dragging.current) return
    e.preventDefault()
    moveDrag(e.touches[0].clientY)
  }
  const onSheetTouchEnd = () => endDrag()

  // 마우스 (PC 테스트용)
  const onSheetMouseDown = (e) => {
    startDrag(e.clientY)
    const onMove = (ev) => moveDrag(ev.clientY)
    const onUp = () => { endDrag(); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end items-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* 시트 본문 */}
      <div
        className="relative w-full max-w-[480px] bg-white rounded-t-2xl flex flex-col touch-none cursor-grab active:cursor-grabbing"
        style={{
          maxHeight: '85vh',
          transform: `translateY(${translateY}px)`,
          transition: dragging.current ? 'none' : 'transform 0.25s ease',
        }}
        onMouseDown={onSheetMouseDown}
        onTouchStart={onSheetTouchStart}
        onTouchMove={onSheetTouchMove}
        onTouchEnd={onSheetTouchEnd}
      >
        {/* 핸들 인디케이터 */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 타이틀 */}
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

        {/* 스크롤 콘텐츠 — 드래그와 완전 분리 */}
        <div
          ref={contentRef}
          className="flex-1 min-h-0 overflow-y-auto p-4 touch-auto cursor-default"
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}