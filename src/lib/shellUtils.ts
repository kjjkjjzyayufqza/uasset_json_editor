import { Command } from '@tauri-apps/plugin-shell'
import { join, dirname, basename } from '@tauri-apps/api/path'
import { resourceDir } from '@tauri-apps/api/path'
import { writeTextFile } from '@tauri-apps/plugin-fs'

export interface UAssetConvertResult {
  success: boolean
  message: string
  outputPath?: string
}

export interface UnrealPakResult {
  success: boolean
  message: string
  pakPath?: string
}

/**
 * 移除文件名中的 _dump 后缀
 * 例如: DA_gop_weapon_dump.json -> DA_gop_weapon.uasset
 */
export function removeDumpSuffix (filename: string): string {
  // 移除扩展名
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')
  // 移除 _dump 后缀
  const nameWithoutDump = nameWithoutExt.replace(/_dump$/, '')
  // 添加 .uasset 扩展名
  return `${nameWithoutDump}.uasset`
}

/**
 * 执行 UAssetGUI fromjson 命令
 * @param jsonFilePath JSON文件的完整路径
 * @param outputFolder 输出文件夹路径
 * @returns 转换结果
 */
export async function executeUAssetConvert (
  jsonFilePath: string,
  outputFolder: string
): Promise<UAssetConvertResult> {
  try {
    // 获取JSON文件名并生成目标文件名
    const jsonFileName = await basename(jsonFilePath)
    const outputFileName = removeDumpSuffix(jsonFileName)
    const outputPath = await join(outputFolder, outputFileName)

    // 获取资源目录路径
    const resourcePath = await resourceDir()
    const uassetGuiPath = await join(resourcePath, 'tools', 'UAssetGUI.exe')

    // 创建命令 - 使用cmd执行UAssetGUI.exe
    console.log(`Full command: ${uassetGuiPath} fromjson ${jsonFilePath} ${outputPath}`)
    const command = Command.create('exec-cmd', [
      "cmd",
      "/c",
      uassetGuiPath,
      'fromjson',
      jsonFilePath,
      outputPath
    ], {
      encoding: 'utf-8'
    })

    // 执行命令
    const result = await command.execute()
    console.log(command)
    if (result.code === 0) {
      return {
        success: true,
        message: `Successfully converted ${jsonFileName} to ${outputPath}`,
        outputPath: outputPath
      }
    } else {
      return {
        success: false,
        message: `UAssetGUI failed with code ${result.code}: ${
          result.stderr || result.stdout
        }`
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to execute UAssetGUI: ${error}`
    }
  }
}

/**
 * 执行 UnrealPak.exe 创建 pak 文件
 * @param modFolder mod文件夹路径
 * @param gamePakFolder 游戏pak文件夹路径（输出目录）
 * @returns 打包结果
 */
export async function executeUnrealPak(
  modFolder: string,
  gamePakFolder: string
): Promise<UnrealPakResult> {
  try {
    // 获取mod文件夹名称
    const modFolderName = await basename(modFolder)
    const pakFileName = `${modFolderName}_P.pak`
    const pakOutputPath = await join(gamePakFolder, pakFileName)

    // 获取资源目录路径
    const resourcePath = await resourceDir()
    const unrealPakPath = await join(resourcePath, 'tools', 'UnrealPak.exe')
    const fileListPath = await join(resourcePath, 'tools', 'filelist.txt')

    // 创建 filelist.txt 内容
    // 格式: "modFolder\*.*" "..\..\..\*.*"
    const fileListContent = `"${modFolder}\\*.*" "..\\..\\..\\*.*"`
    await writeTextFile(fileListPath, fileListContent)

    // 创建 UnrealPak 命令
    console.log(`UnrealPak command: ${unrealPakPath} "${pakOutputPath}" -Create="${fileListPath}" -compress`)
    
    const command = Command.create('exec-cmd', [
      "cmd",
      "/c",
      unrealPakPath,
      `${pakOutputPath}`,
      `-create="${fileListPath}"`,
      '-compress'
    ], {
      encoding: 'utf-8',
      cwd: await join(resourcePath, 'tools') // 设置工作目录为tools文件夹
    })

    // 执行命令
    const result = await command.execute()
    console.log('UnrealPak result:', result)
    
    if (result.code === 0) {
      return {
        success: true,
        message: `Successfully created pak file: ${pakFileName}`,
        pakPath: pakOutputPath
      }
    } else {
      return {
        success: false,
        message: `UnrealPak failed with code ${result.code}: ${
          result.stderr || result.stdout
        }`
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to execute UnrealPak: ${error}`
    }
  }
}

/**
 * 执行完整的转换和打包流程
 * @param jsonFilePath JSON文件的完整路径
 * @param outputFolder 输出文件夹路径
 * @param modFolder mod文件夹路径
 * @param gamePakFolder 游戏pak文件夹路径
 * @returns 转换和打包结果
 */
export async function executeFullConversion(
  jsonFilePath: string,
  outputFolder: string,
  modFolder: string,
  gamePakFolder: string
): Promise<UAssetConvertResult> {
  try {
    // 第一步：执行 UAssetGUI 转换
    const convertResult = await executeUAssetConvert(jsonFilePath, outputFolder)
    
    if (!convertResult.success) {
      return convertResult
    }

    // 第二步：执行 UnrealPak 打包
    const pakResult = await executeUnrealPak(modFolder, gamePakFolder)
    
    if (!pakResult.success) {
      return {
        success: false,
        message: `UAsset conversion succeeded, but pak creation failed: ${pakResult.message}`
      }
    }

    return {
      success: true,
      message: `Successfully converted and packed: ${convertResult.message} and ${pakResult.message}`,
      outputPath: pakResult.pakPath
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to execute full conversion: ${error}`
    }
  }
}
