import Link from "next/link";
import { Container, linkClass } from "@/components/ui";

export default function NotFound() {
  return (
    <Container>
      <div className="rounded-[4px] border border-hairline bg-surface px-6 py-12 text-center">
        <h1 className="text-lg font-semibold text-ink">Олдсонгүй</h1>
        <p className="mt-1 text-ink-2">Ийм төлөвлөгөө эсвэл ажил байхгүй, эсвэл устгагдсан байна.</p>
        <p className="mt-4 text-[13px]">
          <Link href="/" className={linkClass}>
            Ажлууд руу буцах
          </Link>
          <span className="mx-2 text-ink-3">·</span>
          <Link href="/plans" className={linkClass}>
            Бүх төлөвлөгөө
          </Link>
        </p>
      </div>
    </Container>
  );
}
