import lib from './lib.js';

if (Deno.build.os === "linux") {
    if (await lib.existsSync(await lib.join(lib.getHomeDir(), ".concrete", "Concrete-linux-x64", "Concrete"))) {
        console.log("Concrete already exists! Attempting to kill Concrete...");
        await lib.runShell("killall Concrete");
        console.log("Deleting Concrete...");
        try {
            await Deno.remove(await lib.join(lib.getHomeDir(), ".concrete"), { recursive: true });
        } catch (e) {
            if (e.includes("Error: The directory is not empty. (os error 145)")) {
                console.error("Concrete is still running. Please close Concrete and try again.");
                Deno.exit(1);
            } else {
                throw e;
            }
        }
    }

    console.log("Creating Concrete directories...");

    try {
        await Deno.mkdir(await lib.join(lib.getHomeDir(), ".concrete"), { recursive: true });
    } catch (e) {
        console.error("Error creating Concrete directory! " + e);
        Deno.exit(1);
    }

    console.log("Downloading Concrete...");

    try {
        let data = await lib.get("https://api.github.com/repos/ashxi/project-kilo/releases/latest");
        let parsedData = JSON.parse(data);
        let url = "";

        for (let asset of parsedData.assets) {
            if (asset.name.startsWith("Concrete-linux-x64")) {
                url = asset.browser_download_url;
                break;
            }
        }

        await lib.download(url, await lib.join(lib.tempDir(), "Concrete.zip"));
    } catch (e) {
        console.error("Error downloading Concrete! " + e);
        Deno.exit(1);
    }

    console.log("Fetched Concrete.zip. Extracting...");

    await Deno.writeTextFile(await lib.join(lib.tempDir(), "ConcreteInstall"), `#!/bin/bash\nunzip "${await lib.join(lib.tempDir(), "Concrete.zip")}" -d "${await lib.join(lib.getHomeDir(), ".concrete")}"`);
    await lib.runShell(`chmod +x ${await lib.join(lib.tempDir(), "ConcreteInstall")}`);
    await lib.runShell(await lib.join(lib.tempDir(), "ConcreteInstall"));
    console.log("Concrete has been installed!");
} else if (Deno.build.os == "windows") {
    if (await lib.existsSync(await lib.join(lib.getHomeDir(), "AppData", "Local", "Concrete", "Concrete-win32-x64", "Concrete.exe"))) {
        console.log("Concrete already exists! Attempting to kill Concrete...");
        await lib.runShell("taskkill /f /im Concrete.exe");
        console.log("Deleting Concrete...");
        try {
            await Deno.remove(await lib.join(lib.getHomeDir(), "AppData", "Local", "Concrete"), { recursive: true });
        } catch (e) {
            if (e.includes("Error: The directory is not empty. (os error 145)")) {
                console.error("Concrete is still running. Please close Concrete and try again.");
                Deno.exit(1);
            } else {
                throw e;
            }
        }
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
        let parsedData = JSON.parse(data);
        let url = "";

        for (let asset of parsedData.assets) {
            if (asset.name.startsWith("Concrete-win32-x64")) {
                url = asset.browser_download_url;
                break;
            }
        }

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
} else {
    console.log("We do not currently support " + Deno.build.os + ".");
    Deno.exit(1);
}