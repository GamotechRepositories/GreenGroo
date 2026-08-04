import { useLocation } from "react-router-dom";
import ChatWithUsButton from "../home/ChatWithUsButton";

function FloatingCornerActions() {
  const { pathname } = useLocation();

  if (pathname !== "/") return null;

  return (
    <div className="fixed bottom-24 right-4 z-[140] lg:bottom-8 lg:right-6">
      <ChatWithUsButton />
    </div>
  );
}

export default FloatingCornerActions;
