async function runShell(cmd) {
    return new Promise(async (resolve, reject) => {
        const p = Deno.run({
            cmd: cmd.split(" ")
        });

        const code = await p.status();

        resolve(code);
    });
}

/**
 * Download the source file and write it into the destination
 */
async function download(source, destination) {
    // We use browser fetch API
    const response = await fetch(source);
    const blob = await response.blob();

    // We convert the blob into a typed array
    // so we can use it to write the data into the file
    const buf = await blob.arrayBuffer();
    const data = new Uint8Array(buf);

    // We then create a new file and write into it
    const file = await Deno.create(destination);
    await Deno.writeAll(file, data);

    // We can finally close the file
    Deno.close(file.rid);
}

async function join(...args) {
    if (Deno.build.os == "windows") return args.join("\\");
    return args.join("/");
}

async function get(url) {
    const response = await fetch(url);
    const text = await response.text();
    return text;
}

async function getHomeDir() {
    return Deno.env.get("HOME") || Deno.env.get("HOMEPATH") || Deno.env.get("USERPROFILE");
}

async function existsSync(item) {
    try {
        await Deno.stat(item);
        return true;
    } catch (e) {
        return false;
    }
}

async function main() {
    if (Deno.build.os != "windows") {
        console.log("We do not currently support " + Deno.build.os + ".");
        Deno.exit(1);
    } else {
        console.log("Creating Concrete directories...");

        if (existsSync(join(getHomeDir(), "AppData", "Local", "Concrete", "Concrete-win32-x64", "Concrete.exe"))) {
            console.log("Concrete already exists! Attempting to kill Concrete...");
            await runShell("taskkill /f /im Concrete.exe");
            console.log("Deleting Concrete...");
            await Deno.remove(join(getHomeDir(), "AppData", "Local", "Concrete"), { recursive: true });
        }

        try {
            await Deno.mkdir(join(getHomeDir(), "AppData", "Local", "Concrete"), { recursive: true });
        } catch (e) {
            console.error("Error creating Concrete directory! " + e);
            Deno.exit(1);
        }

        console.log("Downloading Concrete...");

        try {
            let data = await get("https://api.github.com/repos/ashxi/project-kilo/releases/latest");
            let url = JSON.parse(data).assets[0].browser_download_url;

            await download(url, join(os.tempDir(), "Concrete.zip"));
        } catch (e) {
            console.error("Error downloading Concrete! " + e);
            Deno.exit(1);
        }
        
        console.log("Fetched Concrete.zip. Extracting...");

        await Deno.writeTextFile(join(os.tempDir(), "ConcreteInstall.bat"), `@echo off\ntar xf "${join(os.tempDir(), "Concrete.zip")}" -C "${join(getHomeDir(), "AppData", "Local", "Concrete")}"`);
        await runShell(join(os.tempDir(), "ConcreteInstall.bat"));
        console.log("Concrete has been installed!\nCreating desktop shortcut...");
        
        let shortcutVBS = "";

        shortcutVBS += `Set oWS = WScript.CreateObject("WScript.Shell")\n`;
        shortcutVBS += `sLinkFile = "${join(getHomeDir(), "Desktop", "Concrete.lnk")}"\n`;
        shortcutVBS += `Set oLink = oWS.CreateShortcut(sLinkFile)\n`;
        shortcutVBS += `    oLink.TargetPath = "${join(getHomeDir(), "AppData", "Local", "Concrete", "Concrete-win32-x64", "Concrete.exe")}"\n`;
        shortcutVBS += `    oLink.Description = "Runs the Concrete code editor."\n`;
        shortcutVBS += `    oLink.IconLocation = "${join(getHomeDir(), "AppData", "Local", "Concrete", "Concrete-win32-x64", "Concrete.exe")}"\n`;
        shortcutVBS += `    oLink.WorkingDirectory = "${join(getHomeDir(), "AppData", "Local", "Concrete", "Concrete-win32-x64")}"\n`;
        shortcutVBS += `oLink.Save\n`;

        await Deno.writeTextFile(join(os.tempDir(), "ConcreteShortcut.vbs"), shortcutVBS);
        await Deno.writeTextFile(join(os.tempDir(), "ConcreteShortcut.bat"), `@echo off\ncscript "${join(os.tempDir(), "ConcreteShortcut.vbs")}"`);
        await runShell(join(os.tempDir(), "ConcreteShortcut.bat"));
        console.log("Concrete shortcut has been created.");
    }   
}

main();