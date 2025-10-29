import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Capitalizes the first letter of each word in a name
 * and makes the rest lowercase
 * @param name - The name to capitalize (e.g., "john doe", "JANE SMITH")
 * @returns Properly capitalized name (e.g., "John Doe", "Jane Smith")
 */
export function capitalizeName(name: string | undefined | null): string {
  if (!name) return "";
  return name
    .split(" ")
    .map(word => {
      if (word.length === 0) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
