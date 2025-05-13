"use client";
import logoTransparent from "public/image.png";
import { MacDock } from "@/components/ui/macDock";
import {
  IconBrandGithub,
  IconBrandX,
  IconExchange,
  IconHome,
  IconNewSection,
  IconTerminal2,
} from "@tabler/icons-react";
import Image from "next/image";
const ProtectedLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const links = [
    {
      title: "Home",
      icon: (
        <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },

    {
      title: "Products",
      icon: (
        <IconTerminal2 className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "Components",
      icon: (
        <IconNewSection className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },

    {
      title: "Changelog",
      icon: (
        <IconExchange className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },

    {
      title: "Twitter",
      icon: (
        <IconBrandX className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "GitHub",
      icon: (
        <IconBrandGithub className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },
  ];
  return (
    <main className="w-screen h-screen relative flex  max-sm:flex-col-reverse">
      <nav className=" sticky sm:w-20 sm:h-full sm:top-0 left-0 w-full h-16 bottom-0 flex sm:flex-col items-center justify-center">
        <Image
          src={logoTransparent}
          alt="logo"
          width={100}
          height={100}
          className="absolute top-4 w-10 rotate-[-1deg] cursor-pointer"
        />
        <MacDock items={links} />
      </nav>
      <main className="grow overflow-y-scroll ">{children}</main>
    </main>
  );
};

export default ProtectedLayout;
