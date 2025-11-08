import { Edit2, Trash2, MoreHorizontal } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UI_TEXT, BUTTON_SIZE_SM } from "../../constants";

interface ThreadItemMenuProps {
  onRename: () => void;
  onDelete: () => void;
}

export function ThreadItemMenu({ onRename, onDelete }: ThreadItemMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div ref={menuRef} className="relative shrink-0 ml-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={`flex ${BUTTON_SIZE_SM} items-center justify-center rounded-md hover:bg-accent/50 transition-opacity ${
            isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        {isMenuOpen && (
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onRename();
                setIsMenuOpen(false);
              }}
            >
              <Edit2 className="h-4 w-4" />
              {UI_TEXT.rename}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setIsMenuOpen(false);
              }}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              {UI_TEXT.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </div>
  );
}
