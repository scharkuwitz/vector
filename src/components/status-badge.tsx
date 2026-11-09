import { AlertIcon } from "./icons";

export function OverdueMark() {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-critical">
      <AlertIcon size={12} />
      Хугацаа хэтэрсэн
    </span>
  );
}
