fx_version "cerulean"

games { "gta5" }

description "NP POLAROID"

version "0.1.0"

server_script "@npx/server/lib.js"
server_script "@np-lib/server/sv_asyncExports.js"
server_script "@np-lib/server/sv_rpc.js"

client_script "@npx/client/lib.js"
client_script "@np-lib/client/cl_rpc.js"
client_script "@np-lib/client/cl_ui.js"

server_scripts {
    "server/sv_*.js",
}

client_scripts {
    "client/cl_*.js",
}

files {
    'ui/ui.html',
    'ui/ui.js'
}

ui_page 'ui/ui.html'