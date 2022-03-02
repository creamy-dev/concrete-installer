export default {
    /**
     * Execute a command then return the status
     * @param {string} cmd - The command to execute 
     * @returns {string} - The status of the command
     */
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
     * @param {string} source The URL of the file to download
     * @param {string} destination The path to write the downloaded file to
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
    /**
     * Joins a file path
     * @param  {...string} args Text to join
     * @returns {string} Joined file path
     */
    "join": async function(...args) {
        let argv = [];
        
        for await (let arg of args) {
            if (arg == "..") {
                delete argv[argv.length - 1];
            } else if (arg.endsWith("\\") || arg.endsWith("/")) {
                argv.push(arg.slice(0, -1));
            } else if (arg.startsWith("\\") || arg.startsWith("/")) {
                argv.push(arg);
            } else {
                argv.push(arg);
            }
        }

        if (Deno.build.os == "windows") return argv.join("\\");
        return argv.join("/");
    },
    /**
     * Gets a utf-8 file and returns its content
     * @param {string} url The URL of the file to read
     * @returns {string} The content of the file
     */
    "get": async function(url) {
        const response = await fetch(url);
        const text = await response.text();
        return text;
    },
    /**
     * Gets the users home directory
     * @returns {string} The user's home directory
     */
    "getHomeDir": function() {
        return Deno.env.get("HOME") || Deno.env.get("HOMEPATH") || Deno.env.get("USERPROFILE");
    },
    /**
     * Gets the system's temporary directory
     * @returns {string} The system's temporary directory
     */
    "tempDir": function() {
        return Deno.env.get("TEMP") || "/tmp"
    },
    /**
     * (Async - Mislabeled Function) Checks if a file or folder exists
     * @param {string} item The item to check 
     * @returns {boolean} True if the item exists, false otherwise
     */
    "existsSync": async function(item) {
        try {
            await Deno.stat(item);
            return true;
        } catch (e) {
            return false;
        }
    }
}