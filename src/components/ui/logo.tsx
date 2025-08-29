import { cn } from "@/lib/utils"

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-6 w-6", className)}
      {...props}
    >
      <path d="M19.167 12.417A6.25 6.25 0 0 0 12.5 4.042h-.084a6.25 6.25 0 0 0-6.583 8.375" />
      <path d="M12.5 4.042V12l6.667.417" />
      <path d="M12.5 12L5.833 4.042" />
      <path d="M12.5 12v7.917" />
      <path d="M12.5 20.375a6.25 6.25 0 0 0 6.667-8.375" />
      <path d="M12.5 20.375a6.25 6.25 0 0 1-6.583-8.375" />
      <path d="M6.417 12.417L5.833 4.042" />
      <path d="M17.583 12.417L19.167 4.042" />
    </svg>
  );
}