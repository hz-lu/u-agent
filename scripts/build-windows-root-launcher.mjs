import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { rcedit } from "rcedit";

const projectRoot = path.resolve(import.meta.dirname, "..");
const outputPath = path.resolve(process.argv[2] || path.join(projectRoot, "OpenClawPro U盘便携版.exe"));
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-root-launcher-"));
const sourcePath = path.join(tmpRoot, "OpenClawProUsbLauncher.cs");
const psPath = path.join(tmpRoot, "compile.ps1");
const iconPath = path.join(projectRoot, "dist", "assets", "icon.ico");

function fail(message) {
  console.error(message);
  process.exit(1);
}

const csharpSource = String.raw`
using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Windows.Forms;

namespace OpenClawProUsbLauncher
{
    internal static class Program
    {
        [STAThread]
        private static int Main()
        {
            try
            {
                string launcherPath = Assembly.GetExecutingAssembly().Location;
                string root = Path.GetDirectoryName(launcherPath) ?? AppDomain.CurrentDomain.BaseDirectory;
                string appDir = Path.Combine(root, "win-unpacked");
                string appExe = Path.Combine(appDir, "OpenClawPro.exe");

                if (!File.Exists(appExe))
                {
                    MessageBox.Show(
                        "没有找到 win-unpacked\\OpenClawPro.exe，请确认程序目录完整。",
                        "OpenClawPro U盘便携版",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return 1;
                }

                ProcessStartInfo info = new ProcessStartInfo();
                info.FileName = appExe;
                info.WorkingDirectory = appDir;
                info.UseShellExecute = true;
                Process.Start(info);
                return 0;
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "启动 OpenClawPro 失败：\r\n" + ex.Message,
                    "OpenClawPro U盘便携版",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return 1;
            }
        }
    }
}
`;

const psSource = String.raw`
param(
  [Parameter(Mandatory=$true)][string]$SourcePath,
  [Parameter(Mandatory=$true)][string]$OutputPath
)

Add-Type -AssemblyName Microsoft.CSharp
$provider = New-Object Microsoft.CSharp.CSharpCodeProvider
$parameters = New-Object System.CodeDom.Compiler.CompilerParameters
$parameters.GenerateExecutable = $true
$parameters.GenerateInMemory = $false
$parameters.OutputAssembly = $OutputPath
$parameters.CompilerOptions = "/target:winexe /optimize+"
[void]$parameters.ReferencedAssemblies.Add("System.dll")
[void]$parameters.ReferencedAssemblies.Add("System.Windows.Forms.dll")

$result = $provider.CompileAssemblyFromFile($parameters, $SourcePath)
if ($result.Errors.HasErrors) {
  foreach ($err in $result.Errors) {
    Write-Error $err.ToString()
  }
  exit 1
}
`;

try {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(sourcePath, csharpSource, "utf8");
  fs.writeFileSync(psPath, psSource, "utf8");
  fs.rmSync(outputPath, { force: true });

  const result = spawnSync("powershell.exe", [
    "-NoProfile",
    "-NonInteractive",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    psPath,
    sourcePath,
    outputPath
  ], {
    cwd: projectRoot,
    encoding: "utf8",
    windowsHide: true,
    timeout: 120000
  });

  if (result.stdout?.trim()) console.log(result.stdout.trim());
  if (result.stderr?.trim()) console.error(result.stderr.trim());
  if (result.status !== 0) fail(`Root launcher compile failed with exit code ${result.status}`);
  if (!fs.existsSync(outputPath)) fail(`Root launcher was not created: ${outputPath}`);

  if (fs.existsSync(iconPath)) {
    await rcedit(outputPath, {
      icon: iconPath,
      "version-string": {
        CompanyName: "OpenClawPro",
        FileDescription: "OpenClawPro USB Portable Launcher",
        ProductName: "OpenClawPro U盘便携版",
        OriginalFilename: "OpenClawPro U盘便携版.exe"
      }
    });
  }

  console.log(JSON.stringify({ ok: true, outputPath }, null, 2));
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
