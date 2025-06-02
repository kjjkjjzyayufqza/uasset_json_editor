import { readTextFile, copyFile, exists } from "@tauri-apps/plugin-fs";
import { basename, join } from "@tauri-apps/api/path";

export interface JsonData {
  [key: string]: any;
}

export const readJsonFile = async (filePath: string): Promise<JsonData> => {
  try {
    const content = await readTextFile(filePath);
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading JSON file:", error);
    throw new Error(`Failed to read JSON file: ${error}`);
  }
};

export const copyFileToOutput = async (
  sourcePath: string,
  outputDir: string
): Promise<string> => {
  try {
    const fileName = await basename(sourcePath);
    const outputPath = await join(outputDir, fileName);
    
    // Check if output directory exists
    const dirExists = await exists(outputDir);
    if (!dirExists) {
      throw new Error(`Output directory does not exist: ${outputDir}`);
    }
    
    await copyFile(sourcePath, outputPath);
    return outputPath;
  } catch (error) {
    console.error("Error copying file:", error);
    throw new Error(`Failed to copy file: ${error}`);
  }
}; 