export default {
    "runShell": async function(cmd) {
        return new Promise(async (resolve, reject) => {
            const p = Deno.run({
                cmd: cmd.split(" ")
            });
    
            const code = await p.status();
    
            resolve(code);
        });
    },
    /**
     * Download the source file and write it into the destination
     */
    "download": async function(source, destination) {
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
    },
    "join": async function(...args) {
        let argv = [];

        for await (let arg of args) {
            if (arg == "..") {
                delete argv[argv.length - 1];
            } else if (Deno.build.os == "windows" && arg.endsWith("\\") || Deno.build.os == "linux" && arg.endsWith("/")) {
                argv.push(arg.slice(0, -1));
            } else {
                argv.push(arg);
            }
        }

        console.log(argv.join("/"));

        if (Deno.build.os == "windows") return argv.join("\\");
        return argv.join("/");
    },
    "get": async function(url) {
        const response = await fetch(url);
        const text = await response.text();
        return text;
    },
    "getHomeDir": function() {
        return Deno.env.get("HOME") || Deno.env.get("HOMEPATH") || Deno.env.get("USERPROFILE");
    },
    "tempDir": function() {
        return Deno.env.get("TEMP") || "/tmp"
    },
    "existsSync": async function(item) {
        try {
            await Deno.stat(item);
            console.log(item);
            console.log(await Deno.stat(item));
            return true;
        } catch (e) {
            return false;
        }
    }
}