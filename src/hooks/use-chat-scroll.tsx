import { useCallback, useEffect, useRef } from "react";

export function useChatScroll<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);

  // Hàm cuộn xuống cuối cùng
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  // Mỗi khi nội dung thay đổi → tự cuộn xuống
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  return { containerRef, scrollToBottom };
}
