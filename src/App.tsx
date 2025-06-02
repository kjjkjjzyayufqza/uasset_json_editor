import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { FilePicker } from "../components/ui/file-picker";
import { useAppStore } from "./hooks/useAppStore";
import { readJsonFile, JsonData } from "./lib/fileUtils";
import { executeFullConversion } from "./lib/shellUtils";
import { Package, FileText, FolderOpen, CheckCircle, AlertCircle } from "lucide-react";
import "./App.css";

function App() {
  const { state, setDumpJsonFile, setOutputFolder, setGamePakFolder, setModFolder, isLoading } = useAppStore();
  const [jsonData, setJsonData] = useState<JsonData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleJsonFileChange = async (filePath: string) => {
    setDumpJsonFile(filePath);
    setJsonData(null);
    setMessage(null);

    if (filePath) {
      try {
        const data = await readJsonFile(filePath);
        setJsonData(data);
        setMessage({ type: "success", text: "JSON file loaded successfully!" });
      } catch (error) {
        setMessage({ type: "error", text: `Failed to load JSON file: ${error}` });
      }
    }
  };

  const handlePack = async () => {
    if (!state.dumpJsonFile || !state.outputFolder || !state.modFolder || !state.gamePakFolder) {
      setMessage({ 
        type: "error", 
        text: "Please select JSON file, output folder, mod folder, and game pak folder" 
      });
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const result = await executeFullConversion(
        state.dumpJsonFile, 
        state.outputFolder,
        state.modFolder,
        state.gamePakFolder
      );
      
      if (result.success) {
        setMessage({ 
          type: "success", 
          text: result.message
        });
      } else {
        setMessage({ 
          type: "error", 
          text: result.message 
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: `Failed to pack file: ${error}` });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <main className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            UAsset JSON Editor
          </CardTitle>
          <CardDescription>
            Select a dump JSON file and output folder to pack your files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Select dump JSON file */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Select dump JSON file
            </label>
            <FilePicker
              type="file"
              value={state.dumpJsonFile}
              onChange={handleJsonFileChange}
              placeholder="Choose JSON file..."
              filters={[
                {
                  name: "JSON Files",
                  extensions: ["json"],
                },
              ]}
            />
            {jsonData && (
              <div className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                JSON file loaded ({Object.keys(jsonData).length} properties)
              </div>
            )}
          </div>

          {/* Select output folder */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Select <span className="font-bold">uasset & uexp</span> output folder
            </label>
            <FilePicker
              type="directory"
              value={state.outputFolder}
              onChange={setOutputFolder}
              placeholder="Choose output folder..."
            />
          </div>

          {/* Select game pak folder */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Select <span className="font-bold">game pak</span> folder
            </label>
            <FilePicker
              type="directory"
              value={state.gamePakFolder}
              onChange={setGamePakFolder}
              placeholder="Choose game pak folder..."
            />
          </div>

          {/* Select mod folder */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Select <span className="font-bold">mod</span> folder
            </label>
            <FilePicker
              type="directory"
              value={state.modFolder}
              onChange={setModFolder}
              placeholder="Choose mod folder..."
            />
          </div>

          {/* Pack button */}
          <Button
            onClick={handlePack}
            disabled={!state.dumpJsonFile || !state.outputFolder || !state.modFolder || !state.gamePakFolder || isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Packing...
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Pack
              </>
            )}
          </Button>

          {/* Status message */}
          {message && (
            <div
              className={`p-3 rounded-md flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default App;
