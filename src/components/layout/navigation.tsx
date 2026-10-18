"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageCircle,
  ChartNoAxesCombined,
  Wallet,
  History,
  Settings,
} from "lucide-react";
import { navigation } from "@/lib/navigation";

const icons = [MessageCircle, ChartNoAxesCombined, Wallet, History, Settings];

export function Navigation({ variant }: { variant: "desktop" | "mobile" }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label={variant === "desktop" ? "เมนูหลัก" : "เมนูมือถือ"}
      className={`navigation navigation-${variant}`}
    >
      {navigation.map((item, index) => {
        const Icon = icons[index];
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            <Icon aria-hidden="true" size={21} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
