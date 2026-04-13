/**
 * 공통 카드 컴포넌트
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.className] - 추가 스타일 클래스
 */
export default function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}
