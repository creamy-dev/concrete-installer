import lib from './lib.js';

async function main() {
    if (Deno.build.os === "linux") {
        console.log(await lib.existsSync(await lib.join(lib.getHomeDir(), "AppData", "Local", "Concrete", "Concrete-win32-x64", "Concrete.exe")));
    } else if (Deno.build.os !== "windows") {
        console.log("We do not currently support " + Deno.build.os + ".");
        Deno.exit(1);
    } else {
        if (await lib.existsSync(await lib.join(lib.getHomeDir(), "AppData", "Local", "Concrete", "Concrete-win32-x64", "Concrete.exe"))) {
            console.log("Concrete already exists! Attempting to kill Concrete...");
            await lib.runShell("taskkill /f /im Concrete.exe");
            console.log("Deleting Concrete...");
            await Deno.remove(await lib.join(lib.getHomeDir(), "AppData", "Local", "Concrete"), { recursive: true });
        }
        
        console.log("Creating Concrete directories...");

        try {
            await Deno.mkdir(await lib.join(lib.getHomeDir(), "AppData", "Local", "Concrete"), { recursive: true });
        } catch (e) {
            console.error("Error creating Concrete directory! " + e);
            Deno.exit(1);
        }

        console.log("Downloading Concrete...");

        try {
            let data = await lib.get("https://api.github.com/repos/ashxi/project-kilo/releases/latest");
            let url = JSON.parse(data).assets[0].browser_download_url;

            await lib.download(url, await lib.join(lib.tempDir(), "Concrete.zip"));
        } catch (e) {
            console.error("Error downloading Concrete! " + e);
            Deno.exit(1);
        }
        
        console.log("Fetched Concrete.zip. Extracting...");

        await Deno.writeTextFile(await lib.join(lib.tempDir(), "ConcreteInstall.bat"), `@echo off\ntar xf "${await lib.join(lib.tempDir(), "Concrete.zip")}" -C "${await lib.join(lib.getHomeDir(), "AppData", "Local", "Concrete")}"`);
        await lib.runShell(await lib.join(lib.tempDir(), "ConcreteInstall.bat"));
        console.log("Concrete has been installed!\nCreating desktop shortcut...");
        
        let shortcutVBS = "";

        shortcutVBS += `Set oWS = WScript.CreateObject("WScript.Shell")\n`;
        shortcutVBS += `sLinkFile = "${await lib.join(lib.getHomeDir(), "Desktop", "Concrete.lnk")}"\n`;
        shortcutVBS += `Set oLink = oWS.CreateShortcut(sLinkFile)\n`;
        shortcutVBS += `    oLink.TargetPath = "${await lib.join(lib.getHomeDir(), "AppData", "Local", "Concrete", "Concrete-win32-x64", "Concrete.exe")}"\n`;
        shortcutVBS += `    oLink.Description = "Runs the Concrete code editor."\n`;
        shortcutVBS += `    oLink.IconLocation = "${await lib.join(lib.getHomeDir(), "AppData", "Local", "Concrete", "Concrete-win32-x64", "Concrete.exe")}"\n`;
        shortcutVBS += `    oLink.WorkingDirectory = "${await lib.join(lib.getHomeDir(), "AppData", "Local", "Concrete", "Concrete-win32-x64")}"\n`;
        shortcutVBS += `oLink.Save\n`;

        await Deno.writeTextFile(await lib.join(lib.tempDir(), "ConcreteShortcut.vbs"), shortcutVBS);
        await Deno.writeTextFile(await lib.join(lib.tempDir(), "ConcreteShortcut.bat"), `@echo off\ncscript "${await lib.join(lib.tempDir(), "ConcreteShortcut.vbs")}"`);
        await lib.runShell(await lib.join(lib.tempDir(), "ConcreteShortcut.bat"));
        console.log("Concrete shortcut has been created.");
    }   
}

main();