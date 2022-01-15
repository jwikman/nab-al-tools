# Running madge

Checkout Madge on [GitHub](https://github.com/pahen/madge)

Run from ./extension

## JS

> node node_modules/madge/bin/cli.js --warning --circular --extensions js ./out/extension.js

## TS

> node node_modules/madge/bin/cli.js --warning --circular --extensions ts ./src/extension.ts

## Export dependency tree as SVG

Requires graphviz:

> sudo apt install graphviz

## Full dependency tree as SVG

JS

> node node_modules/madge/bin/cli.js --warning --image dependency_graph_js.svg --extensions js ./out/extension.js

TS

> node node_modules/madge/bin/cli.js --warning --image dependency_graph_ts.svg --extensions ts ./src/extension.ts

## Circular References as SVG

JS

> node node_modules/madge/bin/cli.js --warning --circular --image dependency_graph_circular_js.svg --extensions js ./out/extension.js

TS

> node node_modules/madge/bin/cli.js --warning --circular --image dependency_graph_circular_ts.svg --extensions ts ./src/extension.ts

## Save as DOT file

JS

> node node_modules/madge/bin/cli.js --dot --warning --circular --extensions js ./out/extensions.js > graph.gv

TS

> node node_modules/madge/bin/cli.js --dot --warning --circular --extensions ts ./src/extensions.ts > graph.gv
