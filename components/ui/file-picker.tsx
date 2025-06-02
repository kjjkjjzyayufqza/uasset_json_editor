import React from "react";
import { Button } from "./button";
import { Input } from "./input";
import { FolderOpen, File } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";

interface FilePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type: "file" | "directory";
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
  className?: string;
}

export const FilePicker: React.FC<FilePickerProps> = ({
  value,
  onChange,
  placeholder,
  type,
  filters,
  className,
}) => {
  const handleOpenDialog = async () => {
    try {
      let selected: string | string[] | null;
      
      if (type === "file") {
        selected = await open({
          multiple: false,
          filters: filters,
        });
      } else {
        selected = await open({
          directory: true,
          multiple: false,
        });
      }

      if (selected && typeof selected === "string") {
        onChange(selected);
      }
    } catch (error) {
      console.error("Error opening dialog:", error);
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Input
        value={value}
        placeholder={placeholder}
        readOnly
        className="flex-1 cursor-pointer"
        onClick={handleOpenDialog}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleOpenDialog}
      >
        {type === "file" ? (
          <File className="h-4 w-4" />
        ) : (
          <FolderOpen className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}; 