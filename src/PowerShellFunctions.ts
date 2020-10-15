import * as vscode from 'vscode';
import { Powershell } from "./PowerShell";
import { Settings, Setting } from "./Settings";
import * as WorkspaceFunctions from './WorkspaceFunctions';
import { join } from "path";
import * as fs from "fs";

export async function uninstallDependenciesPS(): Promise<string> {
    console.log('Running: UninstallDependenciesPS');
    let ps = new Powershell();

    let appId = Settings.getAppSettings()[Setting.AppId];
    let appName = Settings.getAppSettings()[Setting.AppName];
    let launchServer = Settings.getLaunchSettings()[Setting.LaunchServer];
    launchServer = launchServer.substr(launchServer.indexOf(':') + 3); // Remove http:// or https://
    let launchServerInstance = Settings.getLaunchSettings()[Setting.LaunchServerInstance];
    let docker: boolean = Settings.getConfigSettings()[Setting.ConfigPowerShellWithDocker];
    let psScript: string;
    if (docker) {
        throw new Error('Docker not yet supported');
        // https://www.axians-infoma.de/techblog/allow-access-to-the-docker-engine-without-admin-rights-on-windows/
        psScript = `
        $id = Get-NavContainerId -containerName "${launchServer}"
        $sn = New-PSSession -ContainerId $id -RunAsAdministrator    
        `;
    } else {
        psScript = `
        $sn = New-PSSession -ComputerName "${launchServer}"
        `;
    }
    psScript += `
    Invoke-Command -Session $sn -ScriptBlock {
        $AppId = "${appId}"
        $AppName = "${appName}"
        $Server = "${launchServer}"
        $ServerInstance = "${launchServerInstance}"
        Write-Host "Getting App Details from server instance $ServerInstance"

        $ServiceName = 'MicrosoftDynamicsNavServer$${launchServerInstance}'
        $ServicePath = (Get-WmiObject win32_service | ?{$_.Name -eq $ServiceName} | select PathName).PathName
        $ServerExePath = $ServicePath.Split('"')[1]
        $ModulePath = $ServerExePath.Replace('Microsoft.Dynamics.Nav.Server.exe','Microsoft.Dynamics.Nav.Apps.Management.dll')

        Import-Module $ModulePath
        $AppInfoDetails = Get-NAVAppInfo -ServerInstance $ServerInstance | Get-NAVAppInfo
        $AppsToUnpublish = $AppInfoDetails | Select-Object -Property @{Name = "DependentAppId"; Expression = {$_.AppId}}, @{Name = "DependentAppName"; Expression = {$_.Name}} -ExpandProperty Dependencies | Where-Object AppId -EQ $AppId
        $AppsToUnpublish | ForEach-Object {
            Write-Host "Uninstalling $($_.DependentAppName)"
            Get-NAVAppInfo -ServerInstance $ServerInstance -Id $_.DependentAppId | Uninstall-NAVApp
            Write-Host "Unpublishing $($_.DependentAppName)"
            Get-NAVAppInfo -ServerInstance $ServerInstance -Id $_.DependentAppId | Unpublish-NAVApp
        }
    }`;
    await ps.invokePowershell(psScript);
    ps.close();
    return appName;

    // Output:
    // Getting App Details from server instance xxx
    // Uninstalling LicenseProviderTester
    // Unpublishing LicenseProviderTester
    // Uninstalling LicenseProvider
    // Unpublishing LicenseProvider
}

export async function signAppFilePS(): Promise<string> {
    console.log('Running: SignAppFilePS');
    let ps = new Powershell();
    //let navSipPath = 'C:\\Windows\\System32\\NavSip.dll';
    let navSipX64Path = 'C:\\Windows\\SysWow64\\NavSip.dll';
    //if (!fs.existsSync(navSipPath) && !fs.existsSync(navSipX64Path)) {
    if (!fs.existsSync(navSipX64Path)) {
        throw new Error(`navsip.dll not found at "${navSipX64Path}", navsip.dll can be copied from a docker container (Install-NAVSipCryptoProviderFromNavContainer -containerName XXX) or manually from the BC DVD (requires registration with "RegSvr32 /s <path to navsip.dll>")`);
    }

    let appPublisher = Settings.getAppSettings()[Setting.AppPublisher];
    let appName = Settings.getAppSettings()[Setting.AppName];
    let appVersion = Settings.getAppSettings()[Setting.AppVersion];
    let signToolPath = Settings.getConfigSettings()[Setting.ConfigSignToolPath];
    if (signToolPath === '') {
        signToolPath = await installSignTool();
    }
    if (!fs.existsSync(signToolPath)) {
        throw new Error(`signtool.exe not found at "${signToolPath}"`);
    }
    let signCertName = Settings.getConfigSettings()[Setting.ConfigSigningCertificateName];
    if (signCertName.trim() === '') {
        throw new Error(`Setting NAB.SigningCertificateName is empty, cannot sign app file`);
    }

    let workspaceFolderPath = WorkspaceFunctions.getWorkspaceFolder().uri.fsPath;
    let appFileName = `${appPublisher}_${appName}_${appVersion}.app`;
    let appPath = join(workspaceFolderPath, appFileName);
    if (!fs.existsSync(appPath)) {
        throw new Error(`App file "${appPath}" not found`);
    }
    let signedAppFileName = `${appPublisher}_${appName}_${appVersion}_signed.app`;
    let unsignedAppFileName = `${appPublisher}_${appName}_${appVersion}_unsigned.app`;
    
    let signedAppPath = join(workspaceFolderPath, signedAppFileName);
    let unsignedAppPath = join(workspaceFolderPath, unsignedAppFileName);
    if (fs.existsSync(signedAppPath)) {
        throw new Error(`The signed app file "${signedAppPath}" already exists! Please remove this first.`);
    }
    if (fs.existsSync(unsignedAppPath)) {
       fs.unlinkSync(unsignedAppPath);
    }
    fs.copyFileSync(appPath,unsignedAppPath);



    let psScript = `
$SignToolPath = "${signToolPath}"
$SignCertName = "${signCertName}"
$AppPath = "${appPath}"

if(!(Get-ChildItem 'Cert:\\CurrentUser\\My'| Where-Object Subject -Like "CN=$SignCertName*")) {
    Write-Error "The certficate '$SignCertName' not found in the current user's personal certificate store"
}

& "$SignToolPath" @("sign", "/n", "$SignCertName", "/t", "http://timestamp.verisign.com/scripts/timstamp.dll", "$AppPath")

`;
    await ps.invokePowershell(psScript);
    ps.close();

    fs.copyFileSync(appPath, signedAppPath, fs.constants.COPYFILE_EXCL);
    fs.unlinkSync(appPath);
    return signedAppFileName;


    async function installSignTool() {
        let sdkPath = 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\';
        if (fs.existsSync(sdkPath)) {
            let testSignToolPath = join(sdkPath, fs.readdirSync(sdkPath)[0], '\\x64\\SignTool.exe');
            if (fs.existsSync(testSignToolPath)) {
                return testSignToolPath;
            }
        }
        let msgopt: vscode.MessageOptions = { modal: true };
        let msgitmNo: vscode.MessageItem = { isCloseAffordance: true, title: 'No' };
        let msgitmYes: vscode.MessageItem = { isCloseAffordance: false, title: 'Yes' };
        // msgopt.modal = true;

        if (await vscode.window.showInformationMessage('signtool.exe is not found, do you want to try to install this automatically?', msgopt, msgitmYes, msgitmNo) === msgitmNo) {
            throw new Error('SignTool.exe not installed');
        }

        let ps2 = new Powershell();
        let psScript = `if (Test-Path "C:\\Program Files (x86)\\Windows Kits\\10\\bin\\*\\x64\\SignTool.exe") {
            #Write-Host "Signtool found"
            $signToolExe = (get-item "C:\\Program Files (x86)\\Windows Kits\\10\\bin\\*\\x64\\SignTool.exe").FullName
        } else {
            #Write-Host "Downloading Signing Tools"
            $winSdkSetupExe = join-path $env:TEMP "winsdksetup.exe"
            $winSdkSetupUrl = "https://go.microsoft.com/fwlink/p/?LinkID=2023014"
            (New-Object System.Net.WebClient).DownloadFile($winSdkSetupUrl, $winSdkSetupExe)
            #Write-Host "Installing Signing Tools"
            Start-Process $winSdkSetupExe -ArgumentList "/features OptionId.SigningTools /q" -Wait
            if (!(Test-Path "C:\\Program Files (x86)\\Windows Kits\\10\\bin\\*\\x64\\SignTool.exe")) {
                throw "Cannot locate signtool.exe after installation"
            }
            $signToolExe = (get-item "C:\\Program Files (x86)\\Windows Kits\\10\\bin\\*\\x64\\SignTool.exe").FullName
        }    
        $signToolExe`;
        let psResult = await ps2.invokePowershell(psScript);
        ps2.close();
        return psResult.split('\n')[0].trimRight();
    }
    // Output:
}




// $AppFolder = Join-Path $PSScriptRoot "..\App"
// $TestAppFolder = Join-Path $PSScriptRoot "..\TestApp"

// Write-Host "AppFolder: '$AppFolder'"
// $AppPath = (Get-ChildItem $AppFolder -Filter *.app | Select-Object -Last 1).FullName
// Write-Host "Sign app file: '$AppPath'"
// Write-Host "AppFolder: '$TestAppFolder'"
// $TestAppPath = (Get-ChildItem $TestAppFolder -Filter *.app | Select-Object -Last 1).FullName
// Write-Host "Sign app file: '$TestAppPath'"



// $SignToolPath = "C:\Program Files (x86)\Windows Kits\10\bin\10.0.16299.0\x86\signtool.exe"
// $SignCertName = "xxxxx"


// . $SignToolPath sign /n $SignCertName $AppPath
// . $SignToolPath timestamp /t http://timestamp.verisign.com/scripts/timstamp.dll $AppPath


// . $SignToolPath sign /n $SignCertName $TestAppPath
// . $SignToolPath timestamp /t http://timestamp.verisign.com/scripts/timstamp.dll $TestAppPath
