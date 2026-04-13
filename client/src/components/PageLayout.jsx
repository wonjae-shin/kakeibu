/**
 * 페이지 공통 레이아웃 컴포넌트
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.className] - 추가 스타일 클래스
 */
export default function PageLayout({ children, className = "" }) {
  return (
    <div className={`px-4 pt-4 flex flex-col gap-4 pb-nav min-h-screen bg-background ${className}`}>
      {children}
    </div>
  );
}
