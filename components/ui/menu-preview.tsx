"use client";

import * as RdxHoverCard from "@radix-ui/react-hover-card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MenuPreviewProps {
  children: React.ReactNode;
  previewImage: string;
  width?: number;
  height?: number;
}

export const MenuPreview = ({ children, previewImage, width = 250, height = 120 }: MenuPreviewProps) => {
  return (
    <RdxHoverCard.Root
      openDelay={100}
      closeDelay={150}
    >
      <RdxHoverCard.Trigger asChild>
        {children}
      </RdxHoverCard.Trigger>

      <RdxHoverCard.Portal>
        <RdxHoverCard.Content
          className="[perspective:800px] [--radix-hover-card-content-transform-origin:center_center] z-50 bg-black/50 backdrop-blur-md"
          side="top"
          align="center"
          sideOffset={8}
        >
          <motion.div
            initial={{ opacity: 0, rotateY: -90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: 90 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
          >
            <div className="relative overflow-hidden rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-lg">
              <img
                src={previewImage}
                width={width}
                height={height}
                className="block rounded-[5px] pointer-events-none align-top"
                alt="Preview"
                loading="lazy"
              />
            </div>
          </motion.div>
        </RdxHoverCard.Content>
      </RdxHoverCard.Portal>
    </RdxHoverCard.Root>
  );
};
