"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"

const NavbarEntries = [
    { label: "Início", href: "/" },
    { label: "Manifesto", href: "/manifesto" },
    { label: "Blog", href: "/blog" },
]

const NavSegment = () => {
    const path = usePathname()

    return (
        <nav className="flex space-x-4 text-sm font-anton">
            {NavbarEntries.map((entry, index) => {
                const isCurrentPath = path === entry.href
                return (
                    <Link
                        key={index}
                        href={entry.href}
                        className={`relative block text-emerald-600 ${!isCurrentPath && "hover:text-emerald-800 transition-colors duration-500 ease-in-out"} `}
          >
            {entry.label.toUpperCase()}
            {isCurrentPath && (
                <motion.div
                    layoutId="actiVeLinkUnderline"
                    className="absolute bottom-1 left-0 w-full border-t-2 border-emerald-600"
                />
            )}
        </Link>
    )
})}
    </nav >
  )
}

export default NavSegment
